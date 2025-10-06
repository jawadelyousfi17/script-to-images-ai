const OpenAI = require('openai');
const logger = require('../utils/logger');
const ClaudeService = require('./claudeService');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.claudeService = new ClaudeService();
  }

  async chunkScript(script) {
    // Use Claude Sonnet for script chunking
    logger.info('OPENAI', 'Delegating script chunking to Claude Sonnet');
    return await this.claudeService.chunkScript(script);
  }

  async regenerateChunk(originalChunk, context = '') {
    try {
      const prompt = `
        Please regenerate this script chunk while maintaining the same timing and context.
        Make it more engaging and natural while keeping the core message.
        
        Original chunk: ${originalChunk.content}
        Context: ${context}
        Duration: ${originalChunk.endTime - originalChunk.startTime} seconds
        
        Return only the new content text, no JSON formatting needed.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a script writing expert. Generate engaging, natural-sounding script content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error regenerating chunk:', error);
      throw new Error('Failed to regenerate chunk: ' + error.message);
    }
  }

  async analyzeSceneDescription(chunkContent) {
    const startTime = Date.now();

    try {
      const prompt = `
Analyze this script and create a visual scene description for a pictogram illustration.

Script: "${chunkContent}"

INSTRUCTIONS:
1. If the script mentions specific people/characters, describe them with their emotion/action
2. If the script is abstract/narrative (no specific people), create a representative character that embodies the concept
3. Always output in format: "CHARACTER: emotion/action"

Output format examples:
- "Woman: reaching toward man, frustrated. Man: turning away"
- "Person: head in hands, stressed"
- "Person: thinking deeply, contemplative"
- "Person: looking at phone, distracted"
- "Person: sitting quietly, peaceful"
- "Person: working at desk, focused"

IMPORTANT: 
- Always create a character even if the script doesn't explicitly mention one
- The character should represent the main idea or feeling of the script
- Keep it simple and visual
- Output ONLY the character description, no extra text`;

      logger.info('OPENAI', 'Starting scene analysis', {
        model: 'gpt-4',
        contentLength: chunkContent.length,
        operation: 'analyze_scene'
      });

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing text content and creating visual scene descriptions for pictogram illustrations. You always create a character representation, even for abstract concepts. Be creative and visual."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      const duration = Date.now() - startTime;
      logger.logOpenAI('analyze_scene', 'gpt-4', prompt, response, duration);

      const sceneDescription = response.choices[0].message.content.trim();

      logger.info('OPENAI', `Scene analysis completed: "${sceneDescription}"`);
      return sceneDescription;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOpenAI('analyze_scene', 'gpt-4', null, null, duration, error);
      throw new Error('Failed to analyze scene: ' + error.message);
    }
  }

  async analyzeSymbolsAndObjects(chunkContent) {
    const startTime = Date.now();

    try {
      const prompt = `
      Analyze this script and identify the most important SYMBOL, OBJECT, or CONCEPT that represents the core idea.

Script: "${chunkContent}"

Output format examples:
- "Brain with gears (representing thinking/processing)"
- "Light bulb (representing ideas/creativity)"
- "Clock (representing time/urgency)"
- "Book (representing knowledge/learning)"
- "Heart (representing emotion/love)"
- "Question mark (representing curiosity/confusion)"
- "Target with arrow (representing goals/achievement)"
- "Puzzle pieces (representing problem-solving)"

Output ONLY ONE symbol/object with a brief explanation in parentheses. Keep it simple and iconic.`;

      logger.info('OPENAI', 'Starting symbol/object analysis', {
        model: 'gpt-4',
        contentLength: chunkContent.length,
        operation: 'analyze_symbols'
      });

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert at identifying symbolic representations and visual metaphors. Extract the most meaningful symbol or object that represents the core concept of the text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      });

      const duration = Date.now() - startTime;
      logger.logOpenAI('analyze_symbols', 'gpt-4', prompt, response, duration);

      const symbolDescription = response.choices[0].message.content.trim();

      logger.info('OPENAI', `Symbol analysis completed: "${symbolDescription}"`);
      return symbolDescription;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOpenAI('analyze_symbols', 'gpt-4', null, null, duration, error);
      throw new Error('Failed to analyze symbols: ' + error.message);
    }
  }

  async generateImage(chunkContent, color = 'white', quality = 'high', style = 'infographic') {
    const startTime = Date.now();
    const chunkId = `chunk_${Date.now()}`;

    try {
      logger.info('IMAGE_GEN', `Starting image generation`, {
        chunkId,
        color,
        quality,
        style,
        contentLength: chunkContent.length,
        contentPreview: chunkContent.substring(0, 50) + '...'
      });

      // First, get scene analysis from ChatGPT for infographic style
      let sceneDescription = '';
      if (style === 'infographic') {
        logger.info('IMAGE_GEN', 'Getting scene analysis from ChatGPT');
        sceneDescription = await this.analyzeSceneDescription(chunkContent);
        logger.info('IMAGE_GEN', `Scene analysis result: "${sceneDescription}"`);
      }

      // Define style-specific prompts
      const stylePrompts = {
        infographic: `Create a pictogram-style illustration based on this analyzed scene: "${sceneDescription}"

Style requirements:
- Pictogram/icon style with simple geometric shapes
- Pure black background (solid #000000)
- Use ONLY white color (#FFFFFF) for all elements
- Simple human figures with clear facial expressions that match the scene emotions
- Rounded heads with expressive eyes and mouth showing the specific emotion
- Full body stick-figure style or simple geometric bodies
- Body language and poses that reflect the scene context
- Clear emotional expressions and interactions between characters
- Minimalist design with high contrast (white on black)
- No gradients, no other colors, only pure white on pure black
- No text or words in the image
- Focus on conveying the specific scene, emotions, and character relationships through visual storytelling`,

        drawing: `Create a hand-drawn style illustration based on this script content: "${chunkContent}". 
Style requirements:
- Hand-drawn, sketch-like appearance
- Organic lines and natural imperfections
- Artistic and expressive style
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

      const prompt = `${stylePrompts[style] || stylePrompts.infographic}`;

      logger.info('OPENAI', 'Calling image generation API', {
        model: 'gpt-image-1',
        quality,
        size: '1024x1024',
        operation: 'generate_image'
      });

      console.log(prompt)
      const response = await this.openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        quality: quality,
        size: "1024x1024",
        output_format: "png"
      });

      const apiDuration = Date.now() - startTime;
      logger.logOpenAI('generate_image', 'gpt-image-1', prompt, response, apiDuration);

      // GPT-Image-1 returns base64 data, save as PNG file on server
      const base64Data = response.data[0].b64_json;
      console.log('Image generated successfully, base64 length:', base64Data?.length || 'undefined');

      if (!base64Data) {
        console.error('No base64 data received from GPT-Image-1');
        throw new Error('No image data received from GPT-Image-1');
      }

      // Save base64 as PNG file
      const fs = require('fs');
      const path = require('path');
      const { v4: uuidv4 } = require('uuid');

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
      const filename = `image_${shortId}_${lastTwoWords || 'chunk'}.png`;
      const filepath = path.join(uploadsDir, filename);

      // Convert base64 to buffer and save as PNG
      const imageBuffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filepath, imageBuffer);

      const totalDuration = Date.now() - startTime;
      const imageUrl = `/api/images/${filename}`;

      logger.logImageGeneration(chunkId, color, quality, style, imageUrl, totalDuration);

      return imageUrl;
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      logger.logImageGeneration(chunkId, color, quality, style, null, totalDuration, error);
      throw new Error('Failed to generate image: ' + error.message);
    }
  }

  async generateYouTubeTitle(script, options = {}) {
    const startTime = Date.now();

    try {
      const { style = 'engaging', maxLength = 60 } = options;

      // Get first 500 characters of script for context
      const scriptPreview = script.substring(0, 500);

      const stylePrompts = {
        engaging: 'Create an engaging, clickable YouTube title that captures attention and encourages clicks',
        educational: 'Create an educational, informative YouTube title that clearly describes what viewers will learn',
        dramatic: 'Create a dramatic, compelling YouTube title that builds curiosity and suspense',
        howto: 'Create a practical "how-to" style YouTube title that promises specific value and results',
        listicle: 'Create a list-style YouTube title with numbers that promises specific insights or tips'
      };

      const prompt = `
        ${stylePrompts[style] || stylePrompts.engaging} based on this script content:

        "${scriptPreview}${script.length > 500 ? '...' : ''}"

        Requirements:
        - Maximum ${maxLength} characters
        - Engaging and click-worthy
        - Accurately represents the content
        - Uses power words and emotional triggers
        - Optimized for YouTube algorithm
        - No clickbait that misleads viewers

        Return only the title, no quotes or additional text.
      `;

      logger.info('OPENAI', 'Starting YouTube title generation', {
        model: 'gpt-4',
        scriptLength: script.length,
        style,
        maxLength,
        operation: 'generate_youtube_title'
      });

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a YouTube content expert specializing in creating viral, engaging titles that drive views while accurately representing content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 100
      });

      const duration = Date.now() - startTime;
      logger.logOpenAI('generate_youtube_title', 'gpt-4', prompt, response, duration);

      const title = response.choices[0].message.content.trim();

      logger.info('OPENAI', `YouTube title generated successfully: "${title}"`);
      return title;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOpenAI('generate_youtube_title', 'gpt-4', null, null, duration, error);
      throw new Error('Failed to generate YouTube title: ' + error.message);
    }
  }

  async generateYouTubeDescription(script, title, options = {}) {
    const startTime = Date.now();

    try {
      const {
        includeTimestamps = true,
        includeHashtags = true,
        maxLength = 2000,
        callToAction = 'Subscribe for more content like this!'
      } = options;

      const prompt = `
        Create a compelling YouTube video description for a video with this title: "${title}"
        
        Based on this script content:
        "${script}"

        Requirements:
        - Maximum ${maxLength} characters
        - Engaging opening hook (first 2 lines are crucial)
        - Brief summary of what viewers will learn/gain
        - ${includeTimestamps ? 'Include chapter timestamps if the content has clear sections' : 'Do not include timestamps'}
        - ${includeHashtags ? 'Include 5-10 relevant hashtags at the end' : 'Do not include hashtags'}
        - Call to action: "${callToAction}"
        - SEO optimized with relevant keywords
        - Professional and engaging tone
        - Encourage engagement (likes, comments, shares)

        Format:
        1. Hook/Opening (1-2 sentences)
        2. Video summary (2-3 sentences)
        3. Key points or what viewers will learn
        ${includeTimestamps ? '4. Chapter timestamps (if applicable)' : ''}
        5. Call to action and engagement request
        ${includeHashtags ? '6. Relevant hashtags' : ''}

        Return the complete description ready to paste into YouTube.
      `;

      logger.info('OPENAI', 'Starting YouTube description generation', {
        model: 'gpt-4',
        scriptLength: script.length,
        titleLength: title.length,
        includeTimestamps,
        includeHashtags,
        maxLength,
        operation: 'generate_youtube_description'
      });

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a YouTube content strategist expert at writing descriptions that maximize engagement, watch time, and discoverability."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      const duration = Date.now() - startTime;
      logger.logOpenAI('generate_youtube_description', 'gpt-4', prompt, response, duration);

      const description = response.choices[0].message.content.trim();

      logger.info('OPENAI', `YouTube description generated successfully (${description.length} characters)`);
      return description;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOpenAI('generate_youtube_description', 'gpt-4', null, null, duration, error);
      throw new Error('Failed to generate YouTube description: ' + error.message);
    }
  }
}

module.exports = OpenAIService;
