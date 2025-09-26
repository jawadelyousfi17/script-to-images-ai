const Job = require('../models/Job');
const Script = require('../models/Script');
const ImageService = require('./imageService');
const logger = require('../utils/logger');

class JobManager {
  constructor() {
    this.imageService = new ImageService();
    this.isProcessing = false;
    this.currentJob = null;
  }

  // Start the job processor
  async startProcessor() {
    if (this.isProcessing) return;
    
    console.log('🔄 Starting job processor...');
    this.isProcessing = true;
    
    // Resume any incomplete jobs on startup
    await this.resumeIncompleteJobs();
    
    // Start the main processing loop
    this.processJobs();
  }

  // Resume jobs that were interrupted by server restart
  async resumeIncompleteJobs() {
    try {
      const incompleteJobs = await Job.find({
        status: { $in: ['pending', 'processing'] }
      });

      console.log(`📋 Found ${incompleteJobs.length} incomplete jobs to resume`);
      
      for (const job of incompleteJobs) {
        // Reset processing status to pending so they get picked up
        job.status = 'pending';
        await job.save();
        console.log(`🔄 Resumed job ${job._id} for script ${job.scriptId}`);
      }
    } catch (error) {
      console.error('❌ Error resuming incomplete jobs:', error);
    }
  }

  // Main job processing loop
  async processJobs() {
    while (this.isProcessing) {
      try {
        // Get next pending job
        const job = await Job.findOne({ status: 'pending' }).sort({ createdAt: 1 });
        
        if (job) {
          await this.processJob(job);
        } else {
          // No jobs to process, wait a bit
          await this.sleep(5000); // Check every 5 seconds
        }
      } catch (error) {
        console.error('❌ Error in job processing loop:', error);
        await this.sleep(10000); // Wait longer on error
      }
    }
  }

  // Process a single job
  async processJob(job) {
    this.currentJob = job;
    
    try {
      console.log(`🎨 Starting job ${job._id}: ${job.type}`);
      
      // Mark job as processing
      job.status = 'processing';
      await job.save();

      if (job.type === 'batch_image_generation') {
        await this.processBatchImageGeneration(job);
      }

      // Mark job as completed
      job.status = 'completed';
      job.completedAt = new Date();
      await job.save();
      
      console.log(`✅ Completed job ${job._id}`);
      
    } catch (error) {
      console.error(`❌ Error processing job ${job._id}:`, error);
      
      // Mark job as failed
      job.status = 'failed';
      job.error = error.message;
      await job.save();
    } finally {
      this.currentJob = null;
    }
  }

  // Process batch image generation job
  async processBatchImageGeneration(job) {
    const script = await Script.findById(job.scriptId);
    if (!script) {
      throw new Error('Script not found');
    }

    // Get chunks that still need processing
    const pendingChunks = job.chunksToProcess.filter(chunk => 
      chunk.status === 'pending' || chunk.status === 'failed'
    );

    console.log(`🎨 Processing ${pendingChunks.length} chunks for job ${job._id}`);

    for (const chunkItem of pendingChunks) {
      try {
        // Find the actual chunk in the script
        const scriptChunk = script.chunks.find(c => c.id === chunkItem.chunkId);
        if (!scriptChunk) {
          throw new Error(`Chunk ${chunkItem.chunkId} not found in script`);
        }

        // Skip if chunk already has an image
        if (scriptChunk.imageUrl) {
          chunkItem.status = 'completed';
          chunkItem.processedAt = new Date();
          job.progress.processedChunks++;
          await job.save();
          continue;
        }

        console.log(`🎨 Generating image for chunk ${chunkItem.chunkId}`);
        
        // Mark chunk as processing
        chunkItem.status = 'processing';
        await job.save();

        // Generate image using the specified provider
        const imageUrl = await this.imageService.generateImage(
          scriptChunk.content,
          job.config.provider || 'openai',
          job.config.color, 
          job.config.quality,
          job.config.style || 'infographic'
        );

        // Update script with image URL and provider info
        await Script.updateOne(
          { _id: job.scriptId, 'chunks.id': chunkItem.chunkId },
          { 
            $set: { 
              'chunks.$.imageUrl': imageUrl,
              'chunks.$.imageProvider': job.config.provider || 'openai',
              'chunks.$.imageGeneratedAt': new Date()
            } 
          }
        );

        // Mark chunk as completed
        chunkItem.status = 'completed';
        chunkItem.processedAt = new Date();
        job.progress.processedChunks++;
        
        console.log(`✅ Generated image for chunk ${chunkItem.chunkId} (${job.progress.processedChunks}/${job.progress.totalChunks})`);

        // Rate limiting delay
        await this.sleep(1000);

      } catch (error) {
        console.error(`❌ Error processing chunk ${chunkItem.chunkId}:`, error.message);
        
        // Mark chunk as failed
        chunkItem.status = 'failed';
        chunkItem.error = error.message;
        job.progress.failedChunks++;
      }

      // Save progress after each chunk
      await job.save();
    }
  }

  // Create a new batch image generation job
  async createBatchImageJob(scriptId, color, quality, style = 'infographic', provider = 'openai') {
    const script = await Script.findById(scriptId);
    if (!script) {
      throw new Error('Script not found');
    }

    // Check if there's already a pending/processing job for this script
    const existingJob = await Job.findOne({
      scriptId,
      type: 'batch_image_generation',
      status: { $in: ['pending', 'processing'] }
    });

    if (existingJob) {
      return existingJob;
    }

    // Find chunks without images
    const chunksWithoutImages = script.chunks.filter(chunk => !chunk.imageUrl);
    
    if (chunksWithoutImages.length === 0) {
      throw new Error('All chunks already have images');
    }

    // Create job
    const job = new Job({
      scriptId,
      type: 'batch_image_generation',
      status: 'pending',
      progress: {
        totalChunks: chunksWithoutImages.length,
        processedChunks: 0,
        failedChunks: 0
      },
      config: { color, quality, style, provider },
      chunksToProcess: chunksWithoutImages.map(chunk => ({
        chunkId: chunk.id,
        status: 'pending'
      }))
    });

    await job.save();
    
    logger.logBatchJob(job._id, 'created', {
      scriptId,
      totalChunks: chunksWithoutImages.length,
      color,
      quality,
      style,
      provider
    });
    
    return job;
  }

  // Get job status
  async getJobStatus(scriptId) {
    const job = await Job.findOne({
      scriptId,
      type: 'batch_image_generation'
    }).sort({ createdAt: -1 });

    if (!job) {
      return null;
    }

    return {
      jobId: job._id,
      status: job.status,
      progress: job.progress,
      completionPercentage: job.completionPercentage,
      isComplete: job.isComplete,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt,
      error: job.error
    };
  }

  // Utility function for delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Stop the processor
  stopProcessor() {
    console.log('🛑 Stopping job processor...');
    this.isProcessing = false;
  }
}

module.exports = JobManager;
