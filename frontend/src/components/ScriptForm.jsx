import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Typography,
  Card,
  CircularProgress,
  Alert,
} from '@mui/joy';
import { scriptAPI } from '../services/api';

const ScriptForm = ({ onScriptCreated }) => {
  const [title, setTitle] = useState('');
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !script.trim()) {
      setError('Please provide both title and script content');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await scriptAPI.createScript(title.trim(), script.trim());
      console.log('Script created:', result);
      
      // Clear form
      setTitle('');
      setScript('');
      
      // Notify parent component
      if (onScriptCreated) {
        onScriptCreated(result.script);
      }
    } catch (err) {
      console.error('Error creating script:', err);
      setError(err.response?.data?.error || 'Failed to create script. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ p: 4, mb: 4 }}>
      <Typography level="h3" sx={{ mb: 3, fontWeight: 'normal' }}>
        Create New Script
      </Typography>
      
      {error && (
        <Alert color="danger" sx={{ mb: 3 }} variant="soft">
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' }, gap: 3, mb: 3 }}>
          <FormControl>
            <FormLabel sx={{ fontWeight: 'normal' }}>Script Title</FormLabel>
            <Input
              placeholder="Enter a descriptive title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              required
            />
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'end' }}>
            <Button
              type="submit"
              loading={loading}
              loadingIndicator={<CircularProgress size="sm" />}
              disabled={!title.trim() || !script.trim()}
              sx={{ minWidth: '200px', fontWeight: 'normal' }}
            >
              {loading ? 'Processing' : 'Create & Chunk Script'}
            </Button>
            
            {loading && (
              <Typography level="body-sm" color="neutral" sx={{ fontWeight: 'normal' }}>
                AI is analyzing your script...
              </Typography>
            )}
          </Box>
        </Box>

        <FormControl>
          <FormLabel sx={{ fontWeight: 'normal' }}>Script Content</FormLabel>
          <Textarea
            placeholder="Paste your script content here..."
            value={script}
            onChange={(e) => setScript(e.target.value)}
            minRows={10}
            maxRows={25}
            disabled={loading}
            required
            sx={{ 
              fontSize: '14px', 
              lineHeight: 1.6,
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          />
        </FormControl>
      </Box>
    </Card>
  );
};

export default ScriptForm;
