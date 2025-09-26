const OpenAIService = require('./openaiService');
const NanoBananaService = require('./nanoBananaService');
const logger = require('../utils/logger');

class ImageService {
  constructor() {
    this.openaiService = new OpenAIService();
    this.nanoBananaService = new NanoBananaService();
    this.providers = {
      openai: this.openaiService,
      nanobanana: this.nanoBananaService
    };
  }

  /**
   * Generate an image using the specified provider
   * @param {string} chunkContent - The content to generate an image for
   * @param {string} provider - The provider to use ('openai' or 'nanobanana')
   * @param {string} color - The primary color for the image
   * @param {string} quality - The quality setting
   * @param {string} style - The style of the image
   * @returns {Promise<string>} - The URL of the generated image
   */
  async generateImage(chunkContent, provider = 'openai', color = 'white', quality = 'high', style = 'infographic') {
    const startTime = Date.now();
    
    try {
      // Validate provider
      if (!this.providers[provider]) {
        throw new Error(`Invalid image provider: ${provider}. Available providers: ${Object.keys(this.providers).join(', ')}`);
      }

      logger.info('IMAGE_SERVICE', `Generating image with provider: ${provider}`, {
        provider,
        color,
        quality,
        style,
        contentLength: chunkContent.length
      });

      // For NanoBanana provider with infographic style, use OpenAI for scene analysis first
      if (provider === 'nanobanana' && style === 'infographic') {
        logger.info('IMAGE_SERVICE', 'Using OpenAI for scene analysis before NanoBanana generation');
        const sceneDescription = await this.openaiService.analyzeSceneDescription(chunkContent);
        logger.info('IMAGE_SERVICE', `Scene analysis result: "${sceneDescription}"`);
        
        // Pass the scene description to NanoBanana
        const service = this.providers[provider];
        const imageUrl = await service.generateImageWithScene(sceneDescription, color, quality, style);
        
        const duration = Date.now() - startTime;
        logger.info('IMAGE_SERVICE', `Image generated successfully with ${provider} using scene analysis`, {
          provider,
          imageUrl,
          duration,
          sceneDescription
        });

        return imageUrl;
      } else {
        // Use the provider's standard generation method
        const service = this.providers[provider];
        const imageUrl = await service.generateImage(chunkContent, color, quality, style);

        const duration = Date.now() - startTime;
        logger.info('IMAGE_SERVICE', `Image generated successfully with ${provider}`, {
          provider,
          imageUrl,
          duration
        });

        return imageUrl;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('IMAGE_SERVICE', `Failed to generate image with ${provider}`, {
        provider,
        error: error.message,
        duration
      });
      throw error;
    }
  }

  /**
   * Get available providers and their status
   * @returns {Object} - Object containing provider information
   */
  getProviderInfo() {
    return {
      openai: {
        name: 'OpenAI GPT-Image-1',
        available: !!process.env.OPENAI_API_KEY,
        description: 'High-quality image generation using OpenAI\'s latest model'
      },
      nanobanana: {
        name: 'NanoBanana AI',
        available: !!process.env.NANOBANANA_API_KEY,
        description: 'Fast and efficient image generation with NanoBanana API'
      }
    };
  }

  /**
   * Get available providers list
   * @returns {Array} - Array of available provider names
   */
  getAvailableProviders() {
    const providerInfo = this.getProviderInfo();
    return Object.keys(providerInfo).filter(provider => providerInfo[provider].available);
  }

  /**
   * Check if a provider is available
   * @param {string} provider - The provider to check
   * @returns {boolean} - Whether the provider is available
   */
  isProviderAvailable(provider) {
    const providerInfo = this.getProviderInfo();
    return providerInfo[provider]?.available || false;
  }

  /**
   * Get account information for providers that support it
   * @param {string} provider - The provider to get account info for
   * @returns {Promise<Object>} - Account information
   */
  async getAccountInfo(provider) {
    try {
      if (!this.providers[provider]) {
        throw new Error(`Invalid provider: ${provider}`);
      }

      const service = this.providers[provider];
      
      if (provider === 'nanobanana' && service.getAccountCredits) {
        return await service.getAccountCredits();
      }
      
      // OpenAI doesn't have a direct credits endpoint in our current implementation
      if (provider === 'openai') {
        return { message: 'Account info not available for OpenAI provider' };
      }

      throw new Error(`Account info not supported for provider: ${provider}`);
    } catch (error) {
      logger.error('IMAGE_SERVICE', `Failed to get account info for ${provider}`, {
        provider,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Batch generate images for multiple chunks
   * @param {Array} chunks - Array of chunk objects with content
   * @param {string} provider - The provider to use
   * @param {string} color - The primary color for images
   * @param {string} quality - The quality setting
   * @param {string} style - The style of images
   * @param {Function} progressCallback - Optional callback for progress updates
   * @returns {Promise<Array>} - Array of generated image URLs
   */
  async batchGenerateImages(chunks, provider = 'openai', color = 'white', quality = 'high', style = 'infographic', progressCallback = null) {
    const results = [];
    const total = chunks.length;

    logger.info('IMAGE_SERVICE', `Starting batch generation of ${total} images with ${provider}`);

    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunk = chunks[i];
        const imageUrl = await this.generateImage(chunk.content, provider, color, quality, style);
        
        results.push({
          chunkId: chunk.id,
          imageUrl,
          success: true
        });

        if (progressCallback) {
          progressCallback({
            completed: i + 1,
            total,
            progress: Math.round(((i + 1) / total) * 100),
            currentChunk: chunk.id
          });
        }

        logger.info('IMAGE_SERVICE', `Batch progress: ${i + 1}/${total} completed`);
      } catch (error) {
        logger.error('IMAGE_SERVICE', `Failed to generate image for chunk ${chunks[i].id}`, {
          chunkId: chunks[i].id,
          error: error.message
        });

        results.push({
          chunkId: chunks[i].id,
          imageUrl: null,
          success: false,
          error: error.message
        });
      }
    }

    logger.info('IMAGE_SERVICE', `Batch generation completed: ${results.filter(r => r.success).length}/${total} successful`);
    return results;
  }
}

module.exports = ImageService;
