const express = require('express');
const router = express.Router();
const Script = require('../models/Script');
const OpenAIService = require('../services/openaiService');

const openaiService = new OpenAIService();

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
    const { color = 'white', quality = 'high' } = req.body;

    const script = await Script.findById(scriptId);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }

    const chunkIndex = script.chunks.findIndex(chunk => chunk.id === chunkId);
    if (chunkIndex === -1) {
      return res.status(404).json({ error: 'Chunk not found' });
    }

    const chunk = script.chunks[chunkIndex];

    // Generate image using OpenAI with full chunk content
    const imageUrl = await openaiService.generateImage(chunk.content, color, quality);

    // Update the chunk with the image URL
    script.chunks[chunkIndex].imageUrl = imageUrl;
    await script.save();

    res.json({
      message: 'Image generated successfully',
      imageUrl,
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
    const { color = 'white', quality = 'high' } = req.body;
    const jobManager = req.app.locals.jobManager;

    // Create persistent job
    const job = await jobManager.createBatchImageJob(scriptId, color, quality);

    res.json({
      message: 'Batch image generation job created',
      jobId: job._id,
      totalChunks: job.progress.totalChunks,
      status: job.status,
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
      hasJob: true
    });

  } catch (error) {
    console.error('Error getting batch status:', error);
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
