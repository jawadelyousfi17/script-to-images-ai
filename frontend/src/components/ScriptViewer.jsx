import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Chip,
  Button,
  Stack,
  Divider,
  Alert,
} from '@mui/joy';
import ChunkCard from './ChunkCard';
import BatchImageGenerator from './BatchImageGenerator';
import { scriptAPI } from '../services/api';

const ScriptViewer = ({ script: initialScript }) => {
  const [script, setScript] = useState(initialScript);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update script when prop changes
  useEffect(() => {
    setScript(initialScript);
  }, [initialScript]);

  const handleChunkUpdated = (updatedChunk) => {
    setScript(prevScript => ({
      ...prevScript,
      chunks: prevScript.chunks.map(chunk =>
        chunk.id === updatedChunk.id ? updatedChunk : chunk
      )
    }));
  };

  const refreshScript = async () => {
    if (!script?._id) return;

    setLoading(true);
    setError('');

    try {
      const updatedScript = await scriptAPI.getScript(script._id);
      setScript(updatedScript);
    } catch (err) {
      console.error('Error refreshing script:', err);
      setError('Failed to refresh script data');
    } finally {
      setLoading(false);
    }
  };

  if (!script) {
    return (
      <Card variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
        <Typography level="body-lg" color="neutral">
          No script selected. Create a new script to get started.
        </Typography>
      </Card>
    );
  }

  const totalDuration = script.chunks?.length > 0 
    ? Math.max(...script.chunks.map(chunk => chunk.endTime))
    : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBatchComplete = () => {
    // Refresh the script to show newly generated images
    refreshScript();
  };

  return (
    <Box>
      {error && (
        <Alert color="danger" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Batch Image Generator */}
      <BatchImageGenerator 
        script={script} 
        onBatchComplete={handleBatchComplete}
      />

      <Card variant="outlined" sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr auto' }, gap: 3, alignItems: 'start', mb: 3 }}>
          <Box>
            <Typography level="h2" sx={{ mb: 2, fontWeight: 'normal' }}>
              {script.title}
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
              <Box>
                <Typography level="body-xs" color="neutral" sx={{ mb: 0.5 }}>
                  Total Chunks
                </Typography>
                <Typography level="title-sm" sx={{ fontWeight: 'normal' }}>
                  {script.chunks?.length || 0}
                </Typography>
              </Box>
              
              <Box>
                <Typography level="body-xs" color="neutral" sx={{ mb: 0.5 }}>
                  Duration
                </Typography>
                <Typography level="title-sm" sx={{ fontWeight: 'normal' }}>
                  {formatTime(totalDuration)}
                </Typography>
              </Box>
              
              <Box>
                <Typography level="body-xs" color="neutral" sx={{ mb: 0.5 }}>
                  Created
                </Typography>
                <Typography level="title-sm" sx={{ fontWeight: 'normal' }}>
                  {new Date(script.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              
              <Box>
                <Typography level="body-xs" color="neutral" sx={{ mb: 0.5 }}>
                  Images Generated
                </Typography>
                <Typography level="title-sm" sx={{ fontWeight: 'normal' }}>
                  {script.chunks?.filter(chunk => chunk.imageUrl).length || 0} / {script.chunks?.length || 0}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Button
            variant="outlined"
            size="sm"
            onClick={refreshScript}
            loading={loading}
            sx={{ fontWeight: 'normal' }}
          >
            Refresh Data
          </Button>
        </Box>

        <Box>
          <Typography level="title-sm" sx={{ mb: 2, fontWeight: 'normal' }}>
            Original Script
          </Typography>
          <Box sx={{ 
            maxHeight: '200px', 
            overflow: 'auto',
            p: 3,
            bgcolor: 'background.level1',
            borderRadius: 'md',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography level="body-sm" color="neutral" sx={{ 
              fontSize: '14px',
              lineHeight: 1.6,
              fontWeight: 'normal',
              whiteSpace: 'pre-wrap'
            }}>
              {script.originalScript}
            </Typography>
          </Box>
        </Box>
      </Card>

      <Typography level="h3" sx={{ mb: 2 }}>
        Script Chunks ({script.chunks?.length || 0})
      </Typography>

      {script.chunks && script.chunks.length > 0 ? (
        <Stack spacing={2}>
          {script.chunks.map((chunk) => (
            <ChunkCard
              key={chunk.id}
              chunk={chunk}
              scriptId={script._id}
              onChunkUpdated={handleChunkUpdated}
            />
          ))}
        </Stack>
      ) : (
        <Card variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography level="body-lg" color="neutral">
            No chunks available for this script.
          </Typography>
        </Card>
      )}
    </Box>
  );
};

export default ScriptViewer;
