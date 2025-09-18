import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Card, Alert, Stack } from '@mui/joy';
import { scriptAPI } from '../services/api';

const ImageDebugger = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runDiagnostics = async () => {
    setLoading(true);
    setError('');
    setDebugInfo(null);

    try {
      console.log('🔍 Running image diagnostics...');
      
      // Test 1: API Health Check
      const healthCheck = await scriptAPI.healthCheck();
      console.log('✅ Health check:', healthCheck);

      // Test 2: Get Scripts
      const scripts = await scriptAPI.getScripts();
      console.log('✅ Scripts fetched:', scripts.length);

      if (scripts.length === 0) {
        setDebugInfo({
          status: 'no_scripts',
          message: 'No scripts found. Create a script first.'
        });
        return;
      }

      // Test 3: Find script with images
      const scriptWithImages = scripts.find(s => 
        s.chunks && s.chunks.some(c => c.imageUrl)
      );

      if (!scriptWithImages) {
        setDebugInfo({
          status: 'no_images',
          message: 'No scripts with generated images found.',
          totalScripts: scripts.length,
          totalChunks: scripts.reduce((acc, s) => acc + (s.chunks?.length || 0), 0)
        });
        return;
      }

      // Test 4: Analyze image URLs
      const chunksWithImages = scriptWithImages.chunks.filter(c => c.imageUrl);
      const imageUrls = chunksWithImages.map(c => c.imageUrl);
      
      console.log('🖼️ Found images:', imageUrls);

      // Test 5: Test image accessibility
      const imageTests = await Promise.allSettled(
        imageUrls.slice(0, 3).map(async (url) => {
          const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;
          const response = await fetch(fullUrl, { method: 'HEAD' });
          return {
            url: fullUrl,
            status: response.status,
            accessible: response.ok,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length')
          };
        })
      );

      const accessibleImages = imageTests.filter(test => 
        test.status === 'fulfilled' && test.value.accessible
      ).length;

      setDebugInfo({
        status: 'success',
        apiHealth: healthCheck,
        totalScripts: scripts.length,
        scriptWithImages: {
          id: scriptWithImages._id,
          title: scriptWithImages.title,
          totalChunks: scriptWithImages.chunks.length,
          chunksWithImages: chunksWithImages.length
        },
        imageTests: imageTests.map(test => 
          test.status === 'fulfilled' ? test.value : { error: test.reason.message }
        ),
        accessibleImages,
        sampleUrls: imageUrls.slice(0, 3)
      });

    } catch (err) {
      console.error('❌ Diagnostic failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
      <Typography level="h4" sx={{ mb: 2 }}>
        🔍 Image Debug Tool
      </Typography>
      
      <Button 
        onClick={runDiagnostics} 
        loading={loading}
        sx={{ mb: 2 }}
      >
        Run Image Diagnostics
      </Button>

      {error && (
        <Alert color="danger" sx={{ mb: 2 }}>
          Error: {error}
        </Alert>
      )}

      {debugInfo && (
        <Box sx={{ mt: 2 }}>
          {debugInfo.status === 'success' && (
            <Stack spacing={2}>
              <Alert color="success">
                ✅ API Health: {debugInfo.apiHealth.status}
              </Alert>
              
              <Box>
                <Typography level="title-sm">📊 Statistics:</Typography>
                <Typography level="body-sm">
                  • Total Scripts: {debugInfo.totalScripts}
                </Typography>
                <Typography level="body-sm">
                  • Script with Images: "{debugInfo.scriptWithImages.title}"
                </Typography>
                <Typography level="body-sm">
                  • Images Found: {debugInfo.scriptWithImages.chunksWithImages} / {debugInfo.scriptWithImages.totalChunks} chunks
                </Typography>
                <Typography level="body-sm">
                  • Accessible Images: {debugInfo.accessibleImages} / {debugInfo.imageTests.length} tested
                </Typography>
              </Box>

              <Box>
                <Typography level="title-sm">🖼️ Sample Image URLs:</Typography>
                {debugInfo.sampleUrls.map((url, index) => (
                  <Box key={index} sx={{ ml: 2, mb: 1 }}>
                    <Typography level="body-xs" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {url}
                    </Typography>
                    {debugInfo.imageTests[index] && (
                      <Typography level="body-xs" color={debugInfo.imageTests[index].accessible ? 'success' : 'danger'}>
                        {debugInfo.imageTests[index].accessible ? '✅ Accessible' : '❌ Not accessible'} 
                        ({debugInfo.imageTests[index].status || 'Error'})
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>

              {debugInfo.accessibleImages > 0 && (
                <Box>
                  <Typography level="title-sm">🧪 Test Image Display:</Typography>
                  <img 
                    src={`http://localhost:5000${debugInfo.sampleUrls[0]}`}
                    alt="Test"
                    style={{ maxWidth: '200px', border: '1px solid #ccc', borderRadius: '8px' }}
                    onLoad={() => console.log('✅ Test image loaded successfully')}
                    onError={(e) => console.error('❌ Test image failed to load:', e)}
                  />
                </Box>
              )}
            </Stack>
          )}

          {debugInfo.status === 'no_scripts' && (
            <Alert color="warning">
              {debugInfo.message}
            </Alert>
          )}

          {debugInfo.status === 'no_images' && (
            <Alert color="warning">
              <Box>
                <Typography>{debugInfo.message}</Typography>
                <Typography level="body-sm">
                  Found {debugInfo.totalScripts} scripts with {debugInfo.totalChunks} total chunks.
                </Typography>
              </Box>
            </Alert>
          )}
        </Box>
      )}
    </Card>
  );
};

export default ImageDebugger;
