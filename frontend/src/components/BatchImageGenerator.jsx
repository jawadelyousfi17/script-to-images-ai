import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  Alert,
  Chip,
} from '@mui/joy';
import { scriptAPI } from '../services/api';

const BatchImageGenerator = ({ script, onBatchComplete }) => {
  const [batchColor, setBatchColor] = useState('white');
  const [batchQuality, setBatchQuality] = useState('high');
  const [batchStyle, setBatchStyle] = useState('infographic');
  const [batchProvider, setBatchProvider] = useState('openai');
  const [providers, setProviders] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchStatus, setBatchStatus] = useState(null);
  const [error, setError] = useState('');

  // Load providers and check for existing jobs when component loads
  useEffect(() => {
    const loadProvidersAndCheckJob = async () => {
      try {
        // Load available providers
        const providerData = await scriptAPI.getProviders();
        setProviders(providerData);
        
        // Set default provider to first available
        if (providerData.available.length > 0) {
          setBatchProvider(providerData.default || providerData.available[0]);
        }
      } catch (err) {
        console.error('Error loading providers:', err);
      }
      
      if (!script?._id) return;
      
      try {
        const status = await scriptAPI.getBatchStatus(script._id);
        setBatchStatus(status);
        
        // If there's an active job, start polling
        if (status.hasJob && (status.status === 'pending' || status.status === 'processing')) {
          setIsGenerating(true);
          console.log('🔄 Resumed existing job:', status.jobId, 'Status:', status.status);
          console.log('📊 Progress:', status.chunksWithImages, '/', status.totalChunks, 'chunks completed');
        }
      } catch (err) {
        console.error('Error checking existing job:', err);
      }
    };

    loadProvidersAndCheckJob();
  }, [script?._id]);

  // Poll for batch status updates
  useEffect(() => {
    let interval;
    
    if (isGenerating && script?._id) {
      interval = setInterval(async () => {
        try {
          const status = await scriptAPI.getBatchStatus(script._id);
          setBatchStatus(status);
          
          if (status.isComplete || status.status === 'completed' || status.status === 'failed') {
            setIsGenerating(false);
            if (onBatchComplete) {
              onBatchComplete();
            }
          }
        } catch (err) {
          console.error('Error polling batch status:', err);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isGenerating, script?._id, onBatchComplete]);

  const handleBatchGenerate = async () => {
    if (!script?._id) {
      setError('No script selected');
      return;
    }

    setIsGenerating(true);
    setError('');
    setBatchStatus(null);

    try {
      const result = await scriptAPI.batchGenerateImages(script._id, batchColor, batchQuality, batchStyle, batchProvider);
      console.log('Batch generation started:', result);
      
      if (result.chunksToProcess === 0) {
        setIsGenerating(false);
        setBatchStatus({
          totalChunks: result.totalChunks,
          chunksWithImages: result.totalChunks,
          progress: 100,
          isComplete: true
        });
      }
    } catch (err) {
      console.error('Error starting batch generation:', err);
      setError(err.response?.data?.error || 'Failed to start batch generation');
      setIsGenerating(false);
    }
  };

  if (!script) {
    return null;
  }

  const chunksWithoutImages = script.chunks?.filter(chunk => !chunk.imageUrl) || [];
  const allChunksHaveImages = chunksWithoutImages.length === 0;
  const hasActiveJob = batchStatus?.hasJob && (batchStatus?.status === 'pending' || batchStatus?.status === 'processing');

  return (
    <Card variant="outlined" sx={{ p: 4, mb: 4, maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography level="h4" sx={{ fontWeight: 'normal', color: 'text.primary' }}>
          🎨 Batch Image Generation
        </Typography>
        
        <Stack direction="row" spacing={1}>
          {allChunksHaveImages && !hasActiveJob && (
            <Chip color="success" size="sm" variant="soft">
              All Complete
            </Chip>
          )}
          {hasActiveJob && (
            <Chip color="primary" size="sm" variant="soft">
              {batchStatus.status === 'processing' ? 'Processing' : 'Queued'}
            </Chip>
          )}
          {isGenerating && !hasActiveJob && (
            <Chip color="neutral" size="sm" variant="soft">
              Starting
            </Chip>
          )}
        </Stack>
      </Box>

      {error && (
        <Alert color="danger" sx={{ mb: 3 }} variant="soft">
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr 1fr 1fr' }, gap: 3, alignItems: 'end', mb: 3 }}>
        <FormControl>
          <FormLabel sx={{ fontWeight: 'normal' }}>Color</FormLabel>
          <Input
            placeholder="white, blue, red, etc."
            value={batchColor}
            onChange={(e) => setBatchColor(e.target.value)}
            disabled={isGenerating}
            size="sm"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel sx={{ fontWeight: 'normal' }}>Quality</FormLabel>
          <Select
            value={batchQuality}
            onChange={(event, newValue) => setBatchQuality(newValue)}
            disabled={isGenerating}
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
            value={batchStyle}
            onChange={(event, newValue) => setBatchStyle(newValue)}
            disabled={isGenerating}
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
            value={batchProvider}
            onChange={(event, newValue) => setBatchProvider(newValue)}
            disabled={isGenerating || !providers}
            size="sm"
          >
            {providers?.available.map(provider => (
              <Option key={provider} value={provider}>
                {providers.providers[provider]?.name || provider}
              </Option>
            ))}
          </Select>
        </FormControl>

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
            Remaining
          </Typography>
          <Typography level="title-sm" sx={{ fontWeight: 'normal' }}>
            {chunksWithoutImages.length} chunks
          </Typography>
        </Box>
      </Box>

      {batchStatus && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr auto' }, gap: 2, alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography level="body-xs" color="neutral" sx={{ mb: 0.5 }}>
                Progress
              </Typography>
              <Typography level="body-sm" sx={{ fontWeight: 'normal' }}>
                {batchStatus.chunksWithImages} / {batchStatus.totalChunks} chunks
              </Typography>
            </Box>
            
            <Box>
              <Typography level="body-xs" color="neutral" sx={{ mb: 0.5 }}>
                Completion
              </Typography>
              <Typography level="body-sm" sx={{ fontWeight: 'normal' }}>
                {batchStatus.progress}%
              </Typography>
            </Box>
            
            {batchStatus.hasJob && (
              <Box>
                <Typography level="body-xs" color="neutral" sx={{ mb: 0.5 }}>
                  Job Status
                </Typography>
                <Typography level="body-sm" sx={{ fontWeight: 'normal', textTransform: 'capitalize' }}>
                  {batchStatus.status}
                </Typography>
              </Box>
            )}
            
            {batchStatus.updatedAt && (
              <Box>
                <Typography level="body-xs" color="neutral" sx={{ mb: 0.5 }}>
                  Last Updated
                </Typography>
                <Typography level="body-sm" sx={{ fontWeight: 'normal' }}>
                  {new Date(batchStatus.updatedAt).toLocaleTimeString()}
                </Typography>
              </Box>
            )}
          </Box>
          
          <LinearProgress
            determinate
            value={batchStatus.progress}
            sx={{ mb: 2, height: 6 }}
          />
          
          {batchStatus.isComplete && (
            <Alert color="success" variant="soft" sx={{ mb: 2 }}>
              <Typography level="body-sm" sx={{ fontWeight: 'normal' }}>
                Batch generation completed successfully
              </Typography>
              {batchStatus.completedAt && (
                <Typography level="body-xs" color="neutral" sx={{ mt: 0.5 }}>
                  Completed: {new Date(batchStatus.completedAt).toLocaleString()}
                </Typography>
              )}
            </Alert>
          )}
          
          {batchStatus.status === 'failed' && batchStatus.error && (
            <Alert color="danger" variant="soft">
              <Typography level="body-sm" sx={{ fontWeight: 'normal' }}>
                Job failed: {batchStatus.error}
              </Typography>
            </Alert>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="solid"
          onClick={handleBatchGenerate}
          disabled={isGenerating || allChunksHaveImages || hasActiveJob}
          loading={isGenerating && !hasActiveJob}
          sx={{ minWidth: '200px', fontWeight: 'normal' }}
        >
          {hasActiveJob
            ? `${batchStatus.status === 'processing' ? 'Processing' : 'Queued'} (${batchStatus.chunksWithImages}/${batchStatus.totalChunks})`
            : isGenerating 
              ? 'Starting Job' 
              : allChunksHaveImages 
                ? 'All Images Generated' 
                : `Generate ${chunksWithoutImages.length} Images`
          }
        </Button>

        {(isGenerating || (batchStatus && batchStatus.status === 'processing')) && (
          <Typography level="body-sm" color="neutral" sx={{ fontWeight: 'normal' }}>
            Processing in background - safe to close tab
          </Typography>
        )}
      </Box>
    </Card>
  );
};

export default BatchImageGenerator;
