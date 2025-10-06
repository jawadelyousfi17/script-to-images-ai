# Dual Image Generation Feature

## Overview
The system now generates **two images per chunk** when using NanoBanana provider with infographic style:
1. **Main Image**: Scene with characters showing emotions and actions
2. **Secondary Image**: Symbol or object representing the core concept

## How It Works

### 1. **OpenAI Analysis (Two-Stage)**

#### Stage 1: Scene Analysis
- **Method**: `analyzeSceneDescription(chunkContent)`
- **Purpose**: Identifies characters, emotions, and actions
- **Output Format**: "MAN/WOMAN/KID: emotion/action"
- **Example**: "Woman: reaching toward man, frustrated. Man: turning away"

#### Stage 2: Symbol Analysis
- **Method**: `analyzeSymbolsAndObjects(chunkContent)`
- **Purpose**: Identifies the most important symbol/object representing the core idea
- **Output Format**: "Symbol/Object (explanation)"
- **Examples**:
  - "Brain with gears (representing thinking/processing)"
  - "Light bulb (representing ideas/creativity)"
  - "Clock (representing time/urgency)"
  - "Heart (representing emotion/love)"

### 2. **Image Generation (NanoBanana)**

#### Main Image Generation
- **Method**: `generateImageWithScene(sceneDescription)`
- **Prompt Focus**: Characters with emotions and body language
- **Style**: Pictogram with human figures
- **Requirements**:
  - Only one character in frame
  - Clear facial expressions
  - Full body stick-figure style
  - White on black background

#### Secondary Image Generation
- **Method**: `generateSymbolImage(symbolDescription)`
- **Prompt Focus**: Iconic symbols and objects
- **Style**: Pictogram icon style
- **Requirements**:
  - NO people, NO characters, NO human figures
  - Single iconic symbol or object only
  - Clean, simple, recognizable design
  - Centered composition
  - White on black background

### 3. **File Naming Convention**

#### Main Images
- Format: `nanobanana_[shortId]_[lastTwoWords].png`
- Example: `nanobanana_3a166176_mentally_occupied.png`

#### Secondary Images (Symbols)
- Format: `symbol_[shortId]_[lastTwoWords].png`
- Example: `symbol_8e440e6a_brain_gears.png`

## Database Schema Updates

### Chunk Schema Extensions
```javascript
{
  imageUrl: String,              // Main image URL
  secondaryImageUrl: String,     // Secondary image URL (NEW)
  sceneDescription: String,      // Scene analysis result (NEW)
  symbolDescription: String,     // Symbol analysis result (NEW)
  imageProvider: String,         // Provider used
  topic: String                  // Chunk topic
}
```

## API Response Format

### Dual Image Response
```json
{
  "message": "Images generated successfully",
  "imageUrl": "/api/images/nanobanana_3a166176_mentally_occupied.png",
  "secondaryImageUrl": "/api/images/symbol_8e440e6a_brain_gears.png",
  "sceneDescription": "Person: thinking deeply, contemplating",
  "symbolDescription": "Brain with gears (representing thinking/processing)",
  "provider": "nanobanana",
  "chunk": { /* full chunk object */ }
}
```

### Single Image Response (Fallback)
```json
{
  "message": "Image generated successfully",
  "imageUrl": "/api/images/nanobanana_3a166176_mentally_occupied.png",
  "provider": "nanobanana",
  "chunk": { /* full chunk object */ }
}
```

## Frontend Display

### ChunkCard Component Updates
- **Layout**: Side-by-side grid for dual images
- **Main Image**: 
  - Title: "🎬 Main Image (Scene)"
  - Shows scene description below title
  - Individual download button
- **Secondary Image**:
  - Title: "🔣 Secondary Image (Symbol)"
  - Shows symbol description below title
  - Individual download button
- **Responsive**: Stacks vertically on mobile devices

### Visual Indicators
- Scene description shown in **blue/primary** color
- Symbol description shown in **green/success** color
- Both descriptions displayed in italic font

## Logging

### Console Output
```
====================================================================================================
🤖 [OPENAI SCENE ANALYSIS] Analyzing chunk content:
📝 Chunk Content: [content]
====================================================================================================

====================================================================================================
✨ [OPENAI SCENE DESCRIPTION OUTPUT]:
🎬 Scene Description: [result]
📏 Length: [X] characters
====================================================================================================

====================================================================================================
🔣 [OPENAI SYMBOL ANALYSIS] Analyzing chunk content for symbols:
📝 Chunk Content: [content]
====================================================================================================

====================================================================================================
✨ [OPENAI SYMBOL DESCRIPTION OUTPUT]:
🔣 Symbol Description: [result]
📏 Length: [X] characters
====================================================================================================
```

## When Dual Images Are Generated

**Conditions:**
- Provider: `nanobanana`
- Style: `infographic`

**Other combinations** (OpenAI provider, or other styles) will generate **single image only**.

## Benefits

1. **Richer Visual Storytelling**: Two complementary perspectives on the same content
2. **Flexibility**: Users can choose which image fits their needs better
3. **Conceptual Clarity**: Symbols help reinforce abstract concepts
4. **Professional Output**: More options for video production

## Files Modified

### Backend
1. **`backend/services/openaiService.js`**
   - Added `analyzeSymbolsAndObjects()` method

2. **`backend/services/nanoBananaService.js`**
   - Added `generateSymbolImage()` method
   - Added `pollTaskCompletionSymbol()` method
   - Updated `downloadAndSaveImage()` to handle symbol flag

3. **`backend/services/imageService.js`**
   - Updated `generateImage()` to call both generation methods
   - Returns object with both image URLs and descriptions

4. **`backend/models/Script.js`**
   - Added `secondaryImageUrl` field
   - Added `sceneDescription` field
   - Added `symbolDescription` field
   - Added `imageProvider` field

5. **`backend/routes/scripts.js`**
   - Updated image generation endpoint to handle dual image response
   - Saves both images and descriptions to database

### Frontend
6. **`frontend/src/components/ChunkCard.jsx`**
   - Updated image display section to show both images
   - Added scene and symbol descriptions
   - Individual download buttons for each image
   - Responsive grid layout

## Usage Example

### Generate Images for a Chunk
```bash
POST /api/scripts/:scriptId/chunks/:chunkId/generate-image
{
  "color": "white",
  "quality": "high",
  "style": "infographic",
  "provider": "nanobanana"
}
```

### Response
```json
{
  "message": "Images generated successfully",
  "imageUrl": "/api/images/nanobanana_abc123_thinking_deeply.png",
  "secondaryImageUrl": "/api/images/symbol_def456_brain_gears.png",
  "sceneDescription": "Person: head in hands, contemplating",
  "symbolDescription": "Brain with gears (representing thinking/processing)",
  "provider": "nanobanana"
}
```

## Future Enhancements

1. **Batch Generation**: Support dual images in batch processing
2. **Style Options**: Allow users to choose symbol style (minimalist, detailed, etc.)
3. **Symbol Library**: Cache common symbols for faster generation
4. **Custom Symbols**: Allow users to suggest specific symbols
5. **Symbol Variations**: Generate multiple symbol options to choose from

## Testing

To test the feature:
1. Upload a script and chunk it
2. Select a chunk
3. Choose provider: **NanoBanana**
4. Choose style: **Infographic**
5. Click "Generate Image"
6. Wait for both images to generate
7. Verify both images appear side-by-side
8. Check scene and symbol descriptions
9. Test individual download buttons

## Troubleshooting

### Only One Image Generated
- Check provider is set to `nanobanana`
- Check style is set to `infographic`
- Check console logs for errors

### Symbol Image Shows Characters
- Review OpenAI symbol analysis prompt
- Check NanoBanana prompt explicitly excludes people
- Verify `isSymbol` flag is passed correctly

### Images Not Saving
- Check `backend/uploads/` directory exists
- Verify file permissions
- Check NanoBanana API credits
