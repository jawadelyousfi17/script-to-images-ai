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

        illustration: `
        
        
        Style requirements:
        Minimalist cartoon illustration,
         hand-drawn style,
          soft color palette,
           simple lines and shapes,
            minimal shading, charming and friendly aesthetic,
             rounded edges.`,

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
- Only one character in the frame.
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

  async generateSymbolImage(symbolDescription, color = 'white', quality = 'high', style = 'infographic') {
    const startTime = Date.now();
    const chunkId = `symbol_${Date.now()}`;

    try {
      if (!this.apiKey) {
        throw new Error('NanoBanana API key not configured');
      }

      logger.info('IMAGE_GEN', `Starting NanoBanana symbol/object image generation`, {
        chunkId,
        color,
        quality,
        style,
        symbolDescription: symbolDescription.substring(0, 100) + '...'
      });

      // Create prompt for symbol/object based on the analyzed description from GPT
      const prompt = `Create a pictogram-style icon of: ${symbolDescription}
- Single iconic symbol or object only
- NO people, NO characters, NO human figures
- Pictogram/icon style with simple geometric shapes
- Pure black background (solid #000000)
- Use ONLY white color (#FFFFFF) for all elements
- Clean, simple, and recognizable design
- Centered composition
- Minimalist design with high contrast (white on black)
- No gradients, no other colors, only pure white on pure black
- No text or words in the image
- Focus on making the symbol/object instantly recognizable`;

      logger.info('NANOBANANA', 'Calling image generation API with symbol description', {
        model: 'nanobanana',
        operation: 'generate_symbol_image'
      });

      console.log('🔣 [NANOBANANA] Symbol-based prompt being sent to NanoBanana API:');
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
      logger.info('NANOBANANA', `Symbol-based task created with ID: ${taskId}`);

      // Step 2: Poll for completion with symbol flag
      const imageUrl = await this.pollTaskCompletionSymbol(taskId, symbolDescription);

      const totalDuration = Date.now() - startTime;
      logger.logImageGeneration(chunkId, color, quality, style, imageUrl, totalDuration);

      return imageUrl;
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      logger.logImageGeneration(chunkId, color, quality, style, null, totalDuration, error);
      throw new Error('Failed to generate symbol image: ' + error.message);
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
            chunkContent,
            false
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

  async pollTaskCompletionSymbol(taskId, symbolContent, maxAttempts = 30, pollInterval = 5000) {
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
          logger.info('NANOBANANA', `Symbol task ${taskId} completed successfully`);

          // Download and save the symbol image
          const imageUrl = await this.downloadAndSaveImage(
            taskData.response.resultImageUrl || taskData.response.originImageUrl,
            symbolContent,
            true
          );

          return imageUrl;
        } else if (taskData.successFlag === 2 || taskData.successFlag === 3) {
          // Task failed
          throw new Error(`NanoBanana symbol task failed: ${taskData.errorMessage || 'Unknown error'}`);
        }

        // Task still in progress (successFlag === 0)
        logger.info('NANOBANANA', `Symbol task ${taskId} still in progress, attempt ${attempts + 1}/${maxAttempts}`);

        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error(`Symbol task ${taskId} not found`);
        }
        throw error;
      }
    }

    throw new Error(`Symbol task ${taskId} did not complete within ${maxAttempts * pollInterval / 1000} seconds`);
  }

  async downloadAndSaveImage(imageUrl, chunkContent, isSymbol = false) {
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

      // Generate descriptive filename with symbol prefix if needed
      const prefix = isSymbol ? 'symbol' : 'nanobanana';
      const filename = `${prefix}_${shortId}_${lastTwoWords || 'chunk'}.png`;
      const filepath = path.join(uploadsDir, filename);

      // Save the image
      fs.writeFileSync(filepath, response.data);

      const localImageUrl = `/api/images/${filename}`;
      const imageType = isSymbol ? 'Symbol image' : 'Image';
      logger.info('NANOBANANA', `${imageType} saved successfully: ${localImageUrl}`);

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
