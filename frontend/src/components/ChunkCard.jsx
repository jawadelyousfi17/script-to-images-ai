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
  const [imageProvider, setImageProvider] = useState('openai');
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
        
        // Set default provider to first available
        if (providerData.available.length > 0) {
          setImageProvider(providerData.default || providerData.available[0]);
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'auto 1fr' }, gap: 3, alignItems: 'start' }}>
          <Box sx={{ maxWidth: { xs: '100%', md: '300px' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography level="title-sm" sx={{ fontWeight: 'normal' }}>
                  Generated Image
                </Typography>
                {chunk.imageProvider && (
                  <Typography level="body-xs" color="neutral" sx={{ mt: 0.5 }}>
                    Provider: {providers?.providers[chunk.imageProvider]?.name || chunk.imageProvider}
                  </Typography>
                )}
              </Box>
              <Button
                variant="outlined"
                size="sm"
                className="downloadBtn"
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
                Download PNG
              </Button>
            </Box>
            <AspectRatio ratio="1">
              <img
                src={chunk.imageUrl}
                alt={`Generated image for: ${chunk.topic || 'chunk'}`}
                style={{
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
                onLoad={() => console.log('Image loaded successfully')}
                onError={(e) => {
                  console.error('Image failed to load:', e);
                  console.log('Image URL:', chunk.imageUrl);
                }}
              />
            </AspectRatio>
          </Box>
          
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography level="body-xs" color="neutral" sx={{ mb: 1 }}>
              Filename
            </Typography>
            <Typography level="body-xs" color="neutral" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {chunk.imageUrl.split('/').pop()}
            </Typography>
            <Typography level="body-xs" color="neutral" sx={{ mt: 1, opacity: 0.7 }}>
              Contains last 2 words from script
            </Typography>
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default ChunkCard;
