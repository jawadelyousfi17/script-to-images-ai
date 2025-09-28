const express = require('express');
const router = express.Router();
const Script = require('../models/Script');
const OpenAIService = require('../services/openaiService');
const ImageService = require('../services/imageService');

const openaiService = new OpenAIService();
const imageService = new ImageService();

// Create a new script and chunk it
router.post('/', async (req, res) => {
  try {
    const { title, script } = req.body;

    if (!title || !script) {
      return res.status(400).json({ error: 'Title and script are required' });
    }

    // Chunk the script using OpenAI
    const chunks = await openaiService.chunkScript(script);

    // Create and save the script
    const newScript = new Script({
      title,
      originalScript: script,
      chunks
    });

    await newScript.save();

    res.status(201).json({
      message: 'Script created and chunked successfully',
      script: newScript
    });
  } catch (error) {
    console.error('Error creating script:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all scripts
router.get('/', async (req, res) => {
  try {
    const scripts = await Script.find().sort({ createdAt: -1 });
    res.json(scripts);
  } catch (error) {
    console.error('Error fetching scripts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available image providers
router.get('/providers', async (req, res) => {
  try {
    const providerInfo = imageService.getProviderInfo();
    const availableProviders = imageService.getAvailableProviders();

    res.json({
      providers: providerInfo,
      available: availableProviders,
      default: 'openai'
    });
  } catch (error) {
    console.error('Error getting provider info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get account info for a specific provider
router.get('/providers/:provider/account', async (req, res) => {
  try {
    const { provider } = req.params;
    
    if (!imageService.isProviderAvailable(provider)) {
      return res.status(400).json({ 
        error: `Provider '${provider}' is not available` 
      });
    }

    const accountInfo = await imageService.getAccountInfo(provider);
    res.json(accountInfo);
  } catch (error) {
    console.error('Error getting account info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific script
router.get('/:id', async (req, res) => {
  try {
    const script = await Script.findById(req.params.id);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    res.json(script);
  } catch (error) {
    console.error('Error fetching script:', error);
    res.status(500).json({ error: error.message });
  }
});

// Regenerate a specific chunk
router.put('/:scriptId/chunks/:chunkId/regenerate', async (req, res) => {
  try {
    const { scriptId, chunkId } = req.params;
    const { context } = req.body;

    const script = await Script.findById(scriptId);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }

    const chunkIndex = script.chunks.findIndex(chunk => chunk.id === chunkId);
    if (chunkIndex === -1) {
      return res.status(404).json({ error: 'Chunk not found' });
    }

    const originalChunk = script.chunks[chunkIndex];
    const newContent = await openaiService.regenerateChunk(originalChunk, context);

    // Update the chunk content
    script.chunks[chunkIndex].content = newContent;
    await script.save();

    res.json({
      message: 'Chunk regenerated successfully',
      chunk: script.chunks[chunkIndex]
    });
  } catch (error) {
    console.error('Error regenerating chunk:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate image for a chunk
router.post('/:scriptId/chunks/:chunkId/generate-image', async (req, res) => {
  try {
    const { scriptId, chunkId } = req.params;
    const { 
      color = 'white', 
      quality = 'high', 
      style = 'infographic',
      provider = 'openai'
    } = req.body;

    const script = await Script.findById(scriptId);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }

    const chunkIndex = script.chunks.findIndex(chunk => chunk.id === chunkId);
    if (chunkIndex === -1) {
      return res.status(404).json({ error: 'Chunk not found' });
    }

    const chunk = script.chunks[chunkIndex];

    // Validate provider
    if (!imageService.isProviderAvailable(provider)) {
      return res.status(400).json({ 
        error: `Provider '${provider}' is not available. Available providers: ${imageService.getAvailableProviders().join(', ')}` 
      });
    }

    // Generate image using the specified provider
    const imageUrl = await imageService.generateImage(chunk.content, provider, color, quality, style);

    // Update the chunk with the image URL and provider info
    script.chunks[chunkIndex].imageUrl = imageUrl;
    script.chunks[chunkIndex].imageProvider = provider;
    script.chunks[chunkIndex].imageGeneratedAt = new Date();
    await script.save();

    res.json({
      message: 'Image generated successfully',
      imageUrl,
      provider,
      chunk: script.chunks[chunkIndex]
    });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message });
  }
});

// Batch generate images for all chunks in a script
router.post('/:scriptId/batch-generate-images', async (req, res) => {
  try {
    const { scriptId } = req.params;
    const { 
      color = 'white', 
      quality = 'high', 
      style = 'infographic',
      provider = 'openai'
    } = req.body;
    const jobManager = req.app.locals.jobManager;

    // Validate provider
    if (!imageService.isProviderAvailable(provider)) {
      return res.status(400).json({ 
        error: `Provider '${provider}' is not available. Available providers: ${imageService.getAvailableProviders().join(', ')}` 
      });
    }

    console.log(`🔧 [DEBUG] Creating batch job with:`, {
      scriptId,
      color,
      quality,
      style,
      provider
    });

    // Create persistent job with provider parameter
    const job = await jobManager.createBatchImageJob(scriptId, color, quality, style, provider);

    console.log(`🔧 [DEBUG] Job created with config:`, {
      jobId: job._id,
      config: job.config,
      provider: job.config?.provider
    });

    res.json({
      message: 'Batch image generation job created',
      jobId: job._id,
      totalChunks: job.progress.totalChunks,
      status: job.status,
      provider: job.config?.provider || provider,
      persistent: true
    });

  } catch (error) {
    console.error('Error creating batch job:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get batch generation status
router.get('/:scriptId/batch-status', async (req, res) => {
  try {
    const { scriptId } = req.params;
    const jobManager = req.app.locals.jobManager;
    
    // Get job status from job manager
    const jobStatus = await jobManager.getJobStatus(scriptId);
    
    if (!jobStatus) {
      // No job found, check script directly
      const script = await Script.findById(scriptId);
      if (!script) {
        return res.status(404).json({ error: 'Script not found' });
      }

      const totalChunks = script.chunks.length;
      const chunksWithImages = script.chunks.filter(chunk => chunk.imageUrl).length;
      
      return res.json({
        totalChunks,
        chunksWithImages,
        chunksRemaining: totalChunks - chunksWithImages,
        progress: totalChunks > 0 ? Math.round((chunksWithImages / totalChunks) * 100) : 0,
        isComplete: chunksWithImages === totalChunks,
        hasJob: false
      });
    }

    // Return job status
    res.json({
      ...jobStatus,
      totalChunks: jobStatus.progress.totalChunks,
      chunksWithImages: jobStatus.progress.processedChunks,
      chunksRemaining: jobStatus.progress.totalChunks - jobStatus.progress.processedChunks,
      progress: jobStatus.completionPercentage,
      isComplete: jobStatus.isComplete,
      hasJob: true,
      provider: jobStatus.config?.provider || 'openai' // Show which provider the job is using
    });

  } catch (error) {
    console.error('Error getting batch status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate YouTube metadata (title and description)
router.post('/:scriptId/generate-youtube-metadata', async (req, res) => {
  try {
    const { scriptId } = req.params;
    const { 
      titleStyle = 'engaging',
      titleMaxLength = 60,
      includeTimestamps = true,
      includeHashtags = true,
      descriptionMaxLength = 2000,
      callToAction = 'Subscribe for more content like this!'
    } = req.body;

    const script = await Script.findById(scriptId);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }

    const openaiService = new OpenAIService();

    // Generate YouTube title
    const title = await openaiService.generateYouTubeTitle(script.originalScript, {
      style: titleStyle,
      maxLength: titleMaxLength
    });

    // Generate YouTube description
    const description = await openaiService.generateYouTubeDescription(
      script.originalScript, 
      title, 
      {
        includeTimestamps,
        includeHashtags,
        maxLength: descriptionMaxLength,
        callToAction
      }
    );

    // Save the YouTube metadata to the script
    script.youtubeMetadata = {
      title,
      description,
      generatedAt: new Date(),
      options: {
        titleStyle,
        titleMaxLength,
        includeTimestamps,
        includeHashtags,
        descriptionMaxLength,
        callToAction
      }
    };

    await script.save();

    res.json({
      success: true,
      title,
      description,
      titleLength: title.length,
      descriptionLength: description.length
    });

  } catch (error) {
    console.error('Error generating YouTube metadata:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel batch image generation job
router.post('/:scriptId/cancel-batch', async (req, res) => {
  try {
    const { scriptId } = req.params;
    const jobManager = req.app.locals.jobManager;

    const result = await jobManager.cancelBatchJob(scriptId);
    
    res.json(result);
  } catch (error) {
    console.error('Error cancelling batch job:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear all jobs for a script (debug endpoint)
router.post('/:scriptId/clear-jobs', async (req, res) => {
  try {
    const { scriptId } = req.params;
    const Job = require('../models/Job');
    
    const result = await Job.deleteMany({ scriptId });
    console.log(`🗑️ Cleared ${result.deletedCount} jobs for script ${scriptId}`);
    
    res.json({ 
      message: `Cleared ${result.deletedCount} jobs`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error clearing jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a script
router.delete('/:id', async (req, res) => {
  try {
    const script = await Script.findByIdAndDelete(req.params.id);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    res.json({ message: 'Script deleted successfully' });
  } catch (error) {
    console.error('Error deleting script:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
