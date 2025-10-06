import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  AspectRatio,
  Input,
  FormControl,
  FormLabel,
  Stack,
  Select,
  Option,
} from '@mui/joy';
import { scriptAPI } from '../services/api';

const ChunkCard = ({ chunk, scriptId, onChunkUpdated }) => {
  const [regenerating, setRegenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [error, setError] = useState('');
  const [imageColor, setImageColor] = useState('white');
  const [imageQuality, setImageQuality] = useState('high');
  const [imageStyle, setImageStyle] = useState('infographic');
  const [imageProvider, setImageProvider] = useState('nanobanana');
  const [providers, setProviders] = useState(null);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError('');

    try {
      const result = await scriptAPI.regenerateChunk(scriptId, chunk.id);
      console.log('Chunk regenerated:', result);
      
      if (onChunkUpdated) {
        onChunkUpdated(result.chunk);
      }
    } catch (err) {
      console.error('Error regenerating chunk:', err);
      setError(err.response?.data?.error || 'Failed to regenerate chunk');
    } finally {
      setRegenerating(false);
    }
  };

  // Load providers when component mounts
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const providerData = await scriptAPI.getProviders();
        setProviders(providerData);
        
        // Set default provider to nanobanana if available, otherwise use first available
        if (providerData.available.length > 0) {
          const preferredProvider = providerData.available.includes('nanobanana') 
            ? 'nanobanana' 
            : (providerData.default || providerData.available[0]);
          setImageProvider(preferredProvider);
        }
      } catch (err) {
        console.error('Error loading providers:', err);
      }
    };

    loadProviders();
  }, []);

  const handleGenerateImage = async () => {
    setGeneratingImage(true);
    setError('');

    try {
      const result = await scriptAPI.generateImage(scriptId, chunk.id, imageColor, imageQuality, imageStyle, imageProvider);
      console.log('Image generated:', result);
      
      if (onChunkUpdated) {
        onChunkUpdated(result.chunk);
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err.response?.data?.error || 'Failed to generate image');
    } finally {
      setGeneratingImage(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card variant="outlined" sx={{ p: 4, mb: 3 }}>
      {error && (
        <Alert color="danger" sx={{ mb: 3 }} variant="soft">
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography level="title-md" sx={{ fontWeight: 'normal' }}>
              Chunk {chunk.id.split('_').pop()}
            </Typography>
            <Chip size="sm" variant="soft" color="primary">
              {formatTime(chunk.startTime)} - {formatTime(chunk.endTime)}
            </Chip>
            {chunk.topic && (
              <Chip size="sm" variant="soft" color="neutral">
                {chunk.topic}
              </Chip>
            )}
          </Box>
          
          <Typography level="body-md" sx={{ 
            lineHeight: 1.7, 
            fontWeight: 'normal',
            color: 'text.primary'
          }}>
            {chunk.content}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="outlined"
            size="sm"
            onClick={handleRegenerate}
            loading={regenerating}
            disabled={generatingImage}
            sx={{ fontWeight: 'normal' }}
          >
            {regenerating ? 'Regenerating' : 'Regenerate Text'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr auto' }, gap: 2, alignItems: 'end', mb: 3 }}>
        <FormControl>
          <FormLabel sx={{ fontWeight: 'normal' }}>Image Color</FormLabel>
          <Input
            placeholder="white, blue, red, etc."
            value={imageColor}
            onChange={(e) => setImageColor(e.target.value)}
            size="sm"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel sx={{ fontWeight: 'normal' }}>Quality</FormLabel>
          <Select
            value={imageQuality}
            onChange={(event, newValue) => setImageQuality(newValue)}
            size="sm"
          >
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
            <Option value="auto">Auto</Option>
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel sx={{ fontWeight: 'normal' }}>Style</FormLabel>
          <Select
            value={imageStyle}
            onChange={(event, newValue) => setImageStyle(newValue)}
            size="sm"
          >
            <Option value="infographic">Infographic</Option>
            <Option value="drawing">Drawing</Option>
            <Option value="illustration">Illustration</Option>
            <Option value="abstract">Abstract</Option>
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel sx={{ fontWeight: 'normal' }}>Provider</FormLabel>
          <Select
            value={imageProvider}
            onChange={(event, newValue) => setImageProvider(newValue)}
            disabled={!providers}
            size="sm"
          >
            {providers?.available.map(provider => (
              <Option key={provider} value={provider}>
                {providers.providers[provider]?.name || provider}
              </Option>
            ))}
          </Select>
        </FormControl>
        
        <Button
          variant="solid"
          size="sm"
          onClick={handleGenerateImage}
          loading={generatingImage}
          disabled={regenerating}
          sx={{ minWidth: '140px', fontWeight: 'normal' }}
        >
          {generatingImage ? 'Generating' : 'Generate Image'}
        </Button>
      </Box>

      {chunk.imageUrl && (
        <Box>
          <Typography level="title-md" sx={{ fontWeight: 'normal', mb: 2 }}>
            Generated Images
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: chunk.secondaryImageUrl ? '1fr 1fr' : '1fr' }, gap: 3 }}>
            {/* Main Image (Scene with Characters) */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography level="title-sm" sx={{ fontWeight: 'normal' }}>
                    🎬 Main Image {chunk.sceneDescription && '(Scene)'}
                  </Typography>
                  {chunk.imageProvider && (
                    <Typography level="body-xs" color="neutral" sx={{ mt: 0.5 }}>
                      Provider: {providers?.providers[chunk.imageProvider]?.name || chunk.imageProvider}
                    </Typography>
                  )}
                  {chunk.sceneDescription && (
                    <Typography level="body-xs" color="primary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                      {chunk.sceneDescription}
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={() => {
                    const filename = chunk.imageUrl.split('/').pop();
                    const downloadUrl = `${chunk.imageUrl}/download`;
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  sx={{ fontWeight: 'normal' }}
                  title={`Download: ${chunk.imageUrl.split('/').pop()}`}
                >
                  Download
                </Button>
              </Box>
              <AspectRatio ratio="1">
                <img
                  src={chunk.imageUrl}
                  alt={`Main image: ${chunk.sceneDescription || chunk.topic || 'scene'}`}
                  style={{
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                  onLoad={() => console.log('Main image loaded successfully')}
                  onError={(e) => {
                    console.error('Main image failed to load:', e);
                    console.log('Image URL:', chunk.imageUrl);
                  }}
                />
              </AspectRatio>
              <Typography level="body-xs" color="neutral" sx={{ mt: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {chunk.imageUrl.split('/').pop()}
              </Typography>
            </Box>

            {/* Secondary Image (Symbol/Object) */}
            {chunk.secondaryImageUrl && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography level="title-sm" sx={{ fontWeight: 'normal' }}>
                      🔣 Secondary Image (Symbol)
                    </Typography>
                    {chunk.symbolDescription && (
                      <Typography level="body-xs" color="success" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                        {chunk.symbolDescription}
                      </Typography>
                    )}
                  </Box>
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => {
                      const filename = chunk.secondaryImageUrl.split('/').pop();
                      const downloadUrl = `${chunk.secondaryImageUrl}/download`;
                      const link = document.createElement('a');
                      link.href = downloadUrl;
                      link.download = filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    sx={{ fontWeight: 'normal' }}
                    title={`Download: ${chunk.secondaryImageUrl.split('/').pop()}`}
                  >
                    Download
                  </Button>
                </Box>
                <AspectRatio ratio="1">
                  <img
                    src={chunk.secondaryImageUrl}
                    alt={`Symbol: ${chunk.symbolDescription || 'object'}`}
                    style={{
                      objectFit: 'contain',
                      borderRadius: '8px',
                    }}
                    onLoad={() => console.log('Secondary image loaded successfully')}
                    onError={(e) => {
                      console.error('Secondary image failed to load:', e);
                      console.log('Secondary Image URL:', chunk.secondaryImageUrl);
                    }}
                  />
                </AspectRatio>
                <Typography level="body-xs" color="neutral" sx={{ mt: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {chunk.secondaryImageUrl.split('/').pop()}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default ChunkCard;
