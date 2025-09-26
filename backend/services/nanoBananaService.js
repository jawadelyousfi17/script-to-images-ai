const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class NanoBananaService {
  constructor() {
    this.apiKey = process.env.NANOBANANA_API_KEY;
    this.baseUrl = 'https://api.nanobananaapi.ai/api/v1/nanobanana';
    
    if (!this.apiKey) {
      console.warn('NANOBANANA_API_KEY not found in environment variables');
    }
  }

  async generateImage(chunkContent, color = 'white', quality = 'high', style = 'infographic') {
    const startTime = Date.now();
    const chunkId = `chunk_${Date.now()}`;
    
    try {
      if (!this.apiKey) {
        throw new Error('NanoBanana API key not configured');
      }

      logger.info('IMAGE_GEN', `Starting NanoBanana image generation`, {
        chunkId,
        color,
        quality,
        style,
        contentLength: chunkContent.length,
        contentPreview: chunkContent.substring(0, 50) + '...'
      });
      
      // Define style-specific prompts similar to OpenAI service
      const stylePrompts = {
        infographic: `Create a pictogram-style illustration based on this script content: "${chunkContent}"

Style requirements:
- Pictogram/icon style with simple geometric shapes
- Pure black background (solid #000000)
- Use ONLY white color (#FFFFFF) for all elements
- Simple human figures with clear facial expressions
- Rounded heads with expressive eyes and mouth
- Full body stick-figure style or simple geometric bodies
- Clear emotional expressions and interactions between characters
- Minimalist design with high contrast (white on black)
- No gradients, no other colors, only pure white on pure black
- No text or words in the image
- Focus on conveying emotion and meaning through facial expressions and body language`,

        drawing: `Create a hand-drawn style illustration based on this script content: "${chunkContent}". 
Style requirements:
- Hand-drawn, sketch-like appearance
- Organic lines and natural imperfections
- Pencil or pen drawing aesthetic
- Primary color: ${color}
- No background (transparent)
- No text or words in the image`,

        illustration: `Create a detailed artistic illustration based on this script content: "${chunkContent}". 
Style requirements:
- Rich, detailed illustration style
- Artistic and creative interpretation
- More complex visual elements
- Professional illustration quality
- Primary color: ${color}
- No background (transparent)
- No text or words in the image`,

        abstract: `Create an abstract artistic representation based on this script content: "${chunkContent}". 
Style requirements:
- Abstract, conceptual design
- Geometric or organic abstract forms
- Creative interpretation of the content
- Modern abstract art style
- Primary color: ${color}
- No background (transparent)
- No text or words in the image`
      };

      const prompt = stylePrompts[style] || stylePrompts.infographic;

      logger.info('NANOBANANA', 'Calling image generation API', {
        model: 'nanobanana',
        operation: 'generate_image'
      });

      console.log('🎨 [NANOBANANA] Prompt being sent to NanoBanana API:');
      console.log('='.repeat(80));
      console.log(prompt);
      console.log('='.repeat(80));
      
      // Step 1: Submit generation task
      const generateResponse = await axios.post(`${this.baseUrl}/generate`, {
        prompt: prompt,
        numImages: 1,
        type: 'TEXTTOIAMGE',
        callBackUrl: 'https://placeholder-callback.com/callback' // We'll poll instead
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const taskId = generateResponse.data.data.taskId;
      logger.info('NANOBANANA', `Task created with ID: ${taskId}`);

      // Step 2: Poll for completion
      const imageUrl = await this.pollTaskCompletion(taskId, chunkContent);

      const totalDuration = Date.now() - startTime;
      logger.logImageGeneration(chunkId, color, quality, style, imageUrl, totalDuration);
      
      return imageUrl;
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      logger.logImageGeneration(chunkId, color, quality, style, null, totalDuration, error);
      throw new Error('Failed to generate image with NanoBanana: ' + error.message);
    }
  }

  async generateImageWithScene(sceneDescription, color = 'white', quality = 'high', style = 'infographic') {
    const startTime = Date.now();
    const chunkId = `scene_${Date.now()}`;
    
    try {
      if (!this.apiKey) {
        throw new Error('NanoBanana API key not configured');
      }

      logger.info('IMAGE_GEN', `Starting NanoBanana image generation with scene analysis`, {
        chunkId,
        color,
        quality,
        style,
        sceneDescription: sceneDescription.substring(0, 100) + '...'
      });
      
      // Create prompt based on the analyzed scene description from GPT
      const prompt = `Create a pictogram-style illustration of: ${sceneDescription}

Style requirements:
- Pictogram/icon style with simple geometric shapes
- Pure black background (solid #000000)
- Use ONLY white color (#FFFFFF) for all elements
- Simple human figures with clear facial expressions
- Rounded heads with expressive eyes and mouth
- Full body stick-figure style or simple geometric bodies
- Minimalist design with high contrast (white on black)
- No gradients, no other colors, only pure white on pure black
- No text or words in the image`;

      logger.info('NANOBANANA', 'Calling image generation API with scene description', {
        model: 'nanobanana',
        operation: 'generate_image_with_scene'
      });

      console.log('🎨 [NANOBANANA] Scene-based prompt being sent to NanoBanana API:');
      console.log('='.repeat(80));
      console.log(prompt);
      console.log('='.repeat(80));

      // Step 1: Submit generation task
      const generateResponse = await axios.post(`${this.baseUrl}/generate`, {
        prompt: prompt,
        numImages: 1,
        type: 'TEXTTOIAMGE',
        callBackUrl: 'https://placeholder-callback.com/callback' // We'll poll instead
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const taskId = generateResponse.data.data.taskId;
      logger.info('NANOBANANA', `Scene-based task created with ID: ${taskId}`);

      // Step 2: Poll for completion
      const imageUrl = await this.pollTaskCompletion(taskId, sceneDescription);

      const totalDuration = Date.now() - startTime;
      logger.logImageGeneration(chunkId, color, quality, style, imageUrl, totalDuration);
      
      return imageUrl;
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      logger.logImageGeneration(chunkId, color, quality, style, null, totalDuration, error);
      throw new Error('Failed to generate image with scene analysis: ' + error.message);
    }
  }

  async pollTaskCompletion(taskId, chunkContent, maxAttempts = 30, pollInterval = 5000) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`${this.baseUrl}/record-info`, {
          params: { taskId },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        const taskData = response.data.data;
        
        if (taskData.successFlag === 1) {
          // Task completed successfully
          logger.info('NANOBANANA', `Task ${taskId} completed successfully`);
          
          // Download and save the image
          const imageUrl = await this.downloadAndSaveImage(
            taskData.response.resultImageUrl || taskData.response.originImageUrl,
            chunkContent
          );
          
          return imageUrl;
        } else if (taskData.successFlag === 2 || taskData.successFlag === 3) {
          // Task failed
          throw new Error(`NanoBanana task failed: ${taskData.errorMessage || 'Unknown error'}`);
        }
        
        // Task still in progress (successFlag === 0)
        logger.info('NANOBANANA', `Task ${taskId} still in progress, attempt ${attempts + 1}/${maxAttempts}`);
        
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error(`Task ${taskId} not found`);
        }
        throw error;
      }
    }
    
    throw new Error(`Task ${taskId} did not complete within ${maxAttempts * pollInterval / 1000} seconds`);
  }

  async downloadAndSaveImage(imageUrl, chunkContent) {
    try {
      // Download the image
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Extract last 2 words from chunk content for filename
      const words = chunkContent.trim().split(/\s+/).filter(word => word.length > 0);
      let lastTwoWords = '';
      
      if (words.length >= 2) {
        lastTwoWords = words.slice(-2).join('_');
      } else if (words.length === 1) {
        lastTwoWords = words[0];
      } else {
        lastTwoWords = 'content';
      }
      
      // Clean filename and ensure it's not too long
      lastTwoWords = lastTwoWords
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toLowerCase()
        .substring(0, 20); // Limit length
      
      const shortId = uuidv4().substring(0, 8);
      
      // Generate descriptive filename
      const filename = `nanobanana_${shortId}_${lastTwoWords || 'chunk'}.png`;
      const filepath = path.join(uploadsDir, filename);
      
      // Save the image
      fs.writeFileSync(filepath, response.data);
      
      const localImageUrl = `/api/images/${filename}`;
      logger.info('NANOBANANA', `Image saved successfully: ${localImageUrl}`);
      
      return localImageUrl;
    } catch (error) {
      logger.error('NANOBANANA', `Failed to download and save image: ${error.message}`);
      throw new Error('Failed to download and save image: ' + error.message);
    }
  }

  async getAccountCredits() {
    try {
      if (!this.apiKey) {
        throw new Error('NanoBanana API key not configured');
      }

      const response = await axios.get('https://api.nanobananaapi.ai/api/v1/common/credits', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data.data;
    } catch (error) {
      throw new Error('Failed to get account credits: ' + error.message);
    }
  }
}

module.exports = NanoBananaService;
