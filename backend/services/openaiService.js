const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chunkScript(script) {
    try {
      const prompt = `
        Please divide the following script into meaningful chunks of exactly 5 seconds each. 
        Each chunk should respect the context and natural flow of the script.
        Target approximately 15-20 words per chunk (assuming normal speaking pace of ~3-4 words per second).
        Return the result as a JSON array where each chunk has:
        - content: the text content
        - startTime: estimated start time in seconds
        - endTime: estimated end time in seconds (should be startTime + 5)
        - topic: a brief description of what this chunk is about (for image generation)

        Script:
        ${script}

        Please ensure the chunks flow naturally and don't break mid-sentence or mid-thought.
        Each chunk should be exactly 5 seconds long.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a script chunking expert. Always return valid JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      
      // Try to parse JSON from the response
      let chunks;
      try {
        chunks = JSON.parse(content);
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          chunks = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Could not parse JSON from OpenAI response');
        }
      }

      // Add unique IDs to chunks
      chunks = chunks.map((chunk, index) => ({
        ...chunk,
        id: `chunk_${Date.now()}_${index}`
      }));

      return chunks;
    } catch (error) {
      console.error('Error chunking script:', error);
      throw new Error('Failed to chunk script: ' + error.message);
    }
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

  async generateImage(chunkContent, color = 'white', quality = 'high') {
    try {
      console.log(`🎨 Generating image with quality: "${quality}", color: "${color}"`);
      console.log(`📝 Chunk content preview: "${chunkContent.substring(0, 50)}..."`);
      
      const prompt = `Generate an image: Create a minimalist flat vector illustration based on this script content: "${chunkContent}". 

Style requirements:
- Minimalist flat vector illustration style
- Simple design with 1 solid color: ${color}
- No background (transparent)
- Modern infographic style
- No text or words in the image
- Focus on the main visual concept or action described in the script

Analyze the script content and create a visual representation that captures the essence of what's being described or discussed.`;

      console.log(`🚀 Calling OpenAI API with quality: "${quality}"`);
      
      const response = await this.openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        quality: quality,
        size: "1024x1024",
        output_format: "png"
      });

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
      
      console.log('Image saved to:', filepath);
      
      // Return the URL path for frontend access
      return `/api/images/${filename}`;
    } catch (error) {
      console.error('Error generating image:', error);
      throw new Error('Failed to generate image: ' + error.message);
    }
  }
}

module.exports = OpenAIService;
