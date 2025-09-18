import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Typography,
  FormControl,
  FormLabel,
  Input,
  Select,
  Option,
  Stack,
  Alert,
  Chip,
  Textarea,
  Switch,
  Divider,
} from '@mui/joy';
import { scriptAPI } from '../services/api';

const YouTubeMetadataGenerator = ({ script }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState(script?.youtubeMetadata || null);
  
  // Form options
  const [titleStyle, setTitleStyle] = useState('engaging');
  const [titleMaxLength, setTitleMaxLength] = useState(60);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [descriptionMaxLength, setDescriptionMaxLength] = useState(2000);
  const [callToAction, setCallToAction] = useState('Subscribe for more content like this!');

  const handleGenerateMetadata = async () => {
    if (!script?._id) {
      setError('No script selected');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const result = await scriptAPI.generateYouTubeMetadata(script._id, {
        titleStyle,
        titleMaxLength,
        includeTimestamps,
        includeHashtags,
        descriptionMaxLength,
        callToAction
      });

      setMetadata({
        title: result.title,
        description: result.description,
        titleLength: result.titleLength,
        descriptionLength: result.descriptionLength,
        generatedAt: new Date().toISOString()
      });

    } catch (err) {
      console.error('Error generating YouTube metadata:', err);
      setError(err.response?.data?.error || 'Failed to generate YouTube metadata');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log(`${type} copied to clipboard`);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (!script) {
    return null;
  }

  return (
    <Card variant="outlined" sx={{ p: 4, mb: 4, maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography level="h4" sx={{ fontWeight: 'normal', color: 'text.primary' }}>
          📺 YouTube Metadata Generator
        </Typography>
        
        {metadata && (
          <Chip color="success" size="sm" variant="soft">
            Generated {new Date(metadata.generatedAt).toLocaleDateString()}
          </Chip>
        )}
      </Box>

      {error && (
        <Alert color="danger" sx={{ mb: 3 }} variant="soft">
          {error}
        </Alert>
      )}

      {/* Generation Options */}
      <Box sx={{ mb: 4 }}>
        <Typography level="title-sm" sx={{ mb: 2, fontWeight: 'normal' }}>
          Generation Options
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
          <FormControl>
            <FormLabel sx={{ fontWeight: 'normal' }}>Title Style</FormLabel>
            <Select
              value={titleStyle}
              onChange={(event, newValue) => setTitleStyle(newValue)}
              disabled={isGenerating}
              size="sm"
            >
              <Option value="engaging">Engaging & Clickable</Option>
              <Option value="educational">Educational</Option>
              <Option value="dramatic">Dramatic & Compelling</Option>
              <Option value="howto">How-To Style</Option>
              <Option value="listicle">List Style</Option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel sx={{ fontWeight: 'normal' }}>Title Max Length</FormLabel>
            <Input
              type="number"
              value={titleMaxLength}
              onChange={(e) => setTitleMaxLength(parseInt(e.target.value))}
              disabled={isGenerating}
              size="sm"
              slotProps={{
                input: { min: 30, max: 100 }
              }}
            />
          </FormControl>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
          <FormControl>
            <FormLabel sx={{ fontWeight: 'normal' }}>Description Max Length</FormLabel>
            <Input
              type="number"
              value={descriptionMaxLength}
              onChange={(e) => setDescriptionMaxLength(parseInt(e.target.value))}
              disabled={isGenerating}
              size="sm"
              slotProps={{
                input: { min: 500, max: 5000 }
              }}
            />
          </FormControl>

          <FormControl>
            <FormLabel sx={{ fontWeight: 'normal' }}>Call to Action</FormLabel>
            <Input
              value={callToAction}
              onChange={(e) => setCallToAction(e.target.value)}
              disabled={isGenerating}
              size="sm"
              placeholder="Subscribe for more content like this!"
            />
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <FormControl orientation="horizontal" sx={{ gap: 2 }}>
            <Switch
              checked={includeTimestamps}
              onChange={(e) => setIncludeTimestamps(e.target.checked)}
              disabled={isGenerating}
              size="sm"
            />
            <FormLabel sx={{ fontWeight: 'normal' }}>Include Timestamps</FormLabel>
          </FormControl>

          <FormControl orientation="horizontal" sx={{ gap: 2 }}>
            <Switch
              checked={includeHashtags}
              onChange={(e) => setIncludeHashtags(e.target.checked)}
              disabled={isGenerating}
              size="sm"
            />
            <FormLabel sx={{ fontWeight: 'normal' }}>Include Hashtags</FormLabel>
          </FormControl>
        </Box>
      </Box>

      <Button
        variant="solid"
        onClick={handleGenerateMetadata}
        disabled={isGenerating}
        loading={isGenerating}
        sx={{ mb: 4, fontWeight: 'normal' }}
      >
        {isGenerating ? 'Generating...' : 'Generate YouTube Title & Description'}
      </Button>

      {/* Generated Results */}
      {metadata && (
        <Box>
          <Divider sx={{ mb: 3 }} />
          
          {/* Title Section */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography level="title-sm" sx={{ fontWeight: 'normal' }}>
                YouTube Title ({metadata.titleLength} characters)
              </Typography>
              <Button
                variant="outlined"
                size="sm"
                onClick={() => copyToClipboard(metadata.title, 'Title')}
                sx={{ fontWeight: 'normal' }}
              >
                Copy Title
              </Button>
            </Box>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography level="body-sm" sx={{ fontWeight: 'normal', lineHeight: 1.6 }}>
                {metadata.title}
              </Typography>
            </Card>
          </Box>

          {/* Description Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography level="title-sm" sx={{ fontWeight: 'normal' }}>
                YouTube Description ({metadata.descriptionLength} characters)
              </Typography>
              <Button
                variant="outlined"
                size="sm"
                onClick={() => copyToClipboard(metadata.description, 'Description')}
                sx={{ fontWeight: 'normal' }}
              >
                Copy Description
              </Button>
            </Box>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Textarea
                value={metadata.description}
                readOnly
                minRows={8}
                maxRows={15}
                sx={{ 
                  fontFamily: 'inherit',
                  fontSize: 'sm',
                  lineHeight: 1.6,
                  border: 'none',
                  '&:focus-within': {
                    outline: 'none'
                  }
                }}
              />
            </Card>
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default YouTubeMetadataGenerator;
