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
      // TEMPORARY DEBUG: Force nanobanana if it was requested
      if (provider === 'nanobanana') {
        console.log(`🚨 [FORCE DEBUG] NanoBanana was requested, forcing it!`);
      }
      
      // Validate provider
      if (!this.providers[provider]) {
        throw new Error(`Invalid image provider: ${provider}. Available providers: ${Object.keys(this.providers).join(', ')}`);
      }

      console.log(`🔧 [DEBUG] ImageService.generateImage called with:`, {
        provider,
        color,
        quality,
        style,
        contentLength: chunkContent.length
      });
      
      console.log(`🔧 [CRITICAL DEBUG] About to check provider logic for: ${provider} with style: ${style}`);
      
      logger.info('IMAGE_SERVICE', `Generating image with provider: ${provider}`, {
        provider,
        color,
        quality,
        style,
        contentLength: chunkContent.length
      });

      // For NanoBanana provider with infographic style, use OpenAI for scene analysis first
      if (provider === 'nanobanana' && style === 'infographic') {
        console.log(`🎯 [NANOBANANA PATH] Taking NanoBanana + infographic path!`);
        logger.info('IMAGE_SERVICE', 'Using OpenAI for scene and symbol analysis before NanoBanana generation');
        
        console.log('\n' + '='.repeat(100));
        console.log('🤖 [OPENAI SCENE ANALYSIS] Analyzing chunk content:');
        console.log('📝 Chunk Content:', chunkContent);
        console.log('='.repeat(100));
        
        // Generate scene description for main image
        const sceneDescription = await this.openaiService.analyzeSceneDescription(chunkContent);
        
        console.log('\n' + '='.repeat(100));
        console.log('✨ [OPENAI SCENE DESCRIPTION OUTPUT]:');
        console.log('🎬 Scene Description:', sceneDescription);
        console.log('📏 Length:', sceneDescription.length, 'characters');
        console.log('='.repeat(100) + '\n');
        
        logger.info('IMAGE_SERVICE', `Scene analysis result: "${sceneDescription}"`);
        
        // Generate symbol description for secondary image
        console.log('\n' + '='.repeat(100));
        console.log('🔣 [OPENAI SYMBOL ANALYSIS] Analyzing chunk content for symbols:');
        console.log('📝 Chunk Content:', chunkContent);
        console.log('='.repeat(100));
        
        const symbolDescription = await this.openaiService.analyzeSymbolsAndObjects(chunkContent);
        
        console.log('\n' + '='.repeat(100));
        console.log('✨ [OPENAI SYMBOL DESCRIPTION OUTPUT]:');
        console.log('🔣 Symbol Description:', symbolDescription);
        console.log('📏 Length:', symbolDescription.length, 'characters');
        console.log('='.repeat(100) + '\n');
        
        logger.info('IMAGE_SERVICE', `Symbol analysis result: "${symbolDescription}"`);
        
        console.log(`🎯 [NANOBANANA PATH] About to call NanoBanana for both images`);
        const service = this.providers[provider];
        
        // Generate main image (scene with characters)
        const mainImageUrl = await service.generateImageWithScene(sceneDescription, color, quality, style);
        
        // Generate secondary image (symbol/object)
        const secondaryImageUrl = await service.generateSymbolImage(symbolDescription, color, quality, style);
        
        const duration = Date.now() - startTime;
        logger.info('IMAGE_SERVICE', `Both images generated successfully with ${provider}`, {
          provider,
          mainImageUrl,
          secondaryImageUrl,
          duration,
          sceneDescription,
          symbolDescription
        });

        return {
          mainImageUrl,
          secondaryImageUrl,
          sceneDescription,
          symbolDescription
        };
      } else {
        console.log(`🔄 [STANDARD PATH] Taking standard path for provider: ${provider}, style: ${style}`);
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
