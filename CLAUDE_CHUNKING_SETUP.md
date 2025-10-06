# Claude Sonnet Integration for Script Chunking

## Overview
The script chunking functionality now uses **Claude Sonnet 4** (claude-sonnet-4-20250514) instead of GPT-4 for better context-aware chunking.

## Changes Made

### 1. **New ClaudeService** (`/backend/services/claudeService.js`)
- Created a dedicated service for Claude API integration
- Implements the same chunking logic with Claude Sonnet 4
- Returns chunks of 5-10 words based on semantic context

### 2. **Updated OpenAIService** (`/backend/services/openaiService.js`)
- Modified `chunkScript()` method to delegate to ClaudeService
- Maintains backward compatibility with existing code
- No changes needed in routes or other services

### 3. **Package Updates** (`/backend/package.json`)
- Added `@anthropic-ai/sdk` version 0.20.0

### 4. **Environment Variables** (`/backend/.env.example`)
- Added `ANTHROPIC_API_KEY` configuration

## Setup Instructions

### 1. Get Your Anthropic API Key
1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key

### 2. Update Your .env File
Add the following line to your `/backend/.env` file:
```bash
ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here
```

### 3. Install Dependencies (Already Done)
```bash
cd backend
npm install
```

### 4. Restart Your Server
```bash
npm run dev
```

## How It Works

1. **User uploads a script** → API receives the script
2. **Chunking request** → `OpenAIService.chunkScript()` is called
3. **Delegation** → Request is forwarded to `ClaudeService.chunkScript()`
4. **Claude Sonnet 4** → Analyzes the script and creates 5-10 word chunks
5. **Response** → Returns JSON array with chunks containing:
   - `content`: The text content (5-10 words)
   - `startTime`: Estimated start time in seconds
   - `endTime`: Estimated end time in seconds
   - `topic`: Brief description for image generation
   - `id`: Unique identifier

## Benefits of Claude Sonnet

- ✅ **Better context understanding** - Superior semantic chunking
- ✅ **More natural phrase grouping** - Respects language flow
- ✅ **Consistent JSON output** - Reliable structured responses
- ✅ **Cost-effective** - Competitive pricing
- ✅ **Fast response times** - Quick chunking operations

## Model Details

- **Model**: `claude-sonnet-4-20250514`
- **Max Tokens**: 4096
- **Temperature**: 0.3 (for consistent, deterministic chunking)

## Logging

The service includes comprehensive logging:
- Request initiation with script length
- Response duration and content length
- Success/failure status
- Error details if chunking fails

## Fallback

If Claude API fails, the error will be caught and logged. You may want to implement a fallback to the original GPT-4 chunking if needed.

## Testing

Test the chunking by:
1. Upload a script through the frontend
2. Check the console logs for Claude-specific messages
3. Verify chunks are 5-10 words and semantically meaningful
4. Ensure timing calculations are accurate
