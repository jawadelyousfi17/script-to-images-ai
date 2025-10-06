const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async chunkScript(script) {
    const startTime = Date.now();

    try {
      const prompt = `You are an expert at dividing scripts into meaningful time-based chunks for video production.

Divide the following script into chunks of 5-8 seconds each. Each chunk should be a complete thought or phrase that makes sense on its own.

CRITICAL REQUIREMENTS:
- Each chunk must be 5-8 seconds long (assuming normal speaking pace of ~3 words per second)
- This means approximately 15-24 words per chunk
- Understand the CONTEXT and meaning of the script
- Don't break sentences or thoughts in unnatural places
- Group related ideas together even if it means slightly adjusting the duration
- Each chunk should be meaningful enough to generate a visual representation
- Respect natural pauses, punctuation, and narrative flow

Return a JSON array where each chunk has:
- content: the text content (complete phrase/sentence)
- startTime: start time in seconds
- endTime: end time in seconds (should be startTime + 5 to 8 seconds)
- topic: a brief description of what this chunk is about (for image generation)

Script to chunk:
${script}

IMPORTANT: 
- Analyze the full context and meaning of the script
- Create chunks that tell a coherent story
- Each chunk should be 5-8 seconds when spoken at normal pace
- Return ONLY valid JSON array, no markdown formatting or extra text`;

      logger.info('CLAUDE', 'Starting script chunking request', {
        model: 'claude-sonnet-4-20250514',
        scriptLength: script.length,
        operation: 'chunk_script'
      });

      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      });

      const duration = Date.now() - startTime;
      
      // Log the response
      logger.info('CLAUDE', 'Received chunking response', {
        duration,
        contentLength: response.content[0].text.length
      });

      const content = response.content[0].text;

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
          throw new Error('Could not parse JSON from Claude response');
        }
      }

      // Add unique IDs to chunks
      chunks = chunks.map((chunk, index) => ({
        ...chunk,
        id: `chunk_${Date.now()}_${index}`
      }));

      logger.info('CLAUDE', `Script chunked successfully into ${chunks.length} chunks`);
      return chunks;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('CLAUDE', 'Failed to chunk script', {
        duration,
        error: error.message
      });
      throw new Error('Failed to chunk script with Claude: ' + error.message);
    }
  }
}

module.exports = ClaudeService;
