import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Select,
  Option,
  FormControl,
  FormLabel,
  Button,
} from '@mui/joy';
import ScriptForm from './components/ScriptForm';
import ScriptViewer from './components/ScriptViewer';
import LogsViewer from './components/LogsViewer';
import ImageDebugger from './components/ImageDebugger';
import { scriptAPI } from './services/api';

function App() {
  const [currentScript, setCurrentScript] = useState(null);
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('app');

  useEffect(() => {
    checkApiHealth();
  }, []);

  useEffect(() => {
    if (apiStatus === 'connected') {
      loadExistingScripts();
    }
  }, [apiStatus]);

  const checkApiHealth = async () => {
    try {
      await scriptAPI.healthCheck();
      setApiStatus('connected');
      console.log('API connection successful');
    } catch (err) {
      console.error('API health check failed:', err);
      setApiStatus('disconnected');
      setError('Cannot connect to the backend server. Please make sure it is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingScripts = async () => {
    try {
      const existingScripts = await scriptAPI.getScripts();
      setScripts(existingScripts);
      
      // If there are existing scripts and no current script selected, select the most recent one
      if (existingScripts.length > 0 && !currentScript) {
        setCurrentScript(existingScripts[0]);
      }
      
      console.log('Loaded existing scripts:', existingScripts.length);
    } catch (err) {
      console.error('Error loading existing scripts:', err);
      // Don't show error for this, as it's not critical
    }
  };

  const handleScriptCreated = (newScript) => {
    console.log('New script created:', newScript);
    setCurrentScript(newScript);
    setScripts(prevScripts => [newScript, ...prevScripts]); // Add to beginning of list
    setError('');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size="lg" />
        <Typography level="body-lg" sx={{ mt: 2 }}>
          Connecting to server...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography level="h1" sx={{ mb: 1, fontWeight: 'normal' }}>
              Script Chunker & Image Generator
            </Typography>
            <Typography level="body-lg" color="neutral" sx={{ fontWeight: 'normal' }}>
              AI-powered script chunking with automatic image generation
            </Typography>
          </Box>
          
          <Alert 
            color={apiStatus === 'connected' ? 'success' : 'danger'} 
            size="sm"
            variant="soft"
          >
            {apiStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </Alert>
        </Box>

        {/* Tab Navigation */}
        <Box sx={{ display: 'flex', gap: 1, mb: 4 }}>
          <Button
            variant={activeTab === 'app' ? 'solid' : 'outlined'}
            onClick={() => setActiveTab('app')}
            sx={{ fontWeight: 'normal' }}
          >
            📝 Script Generator
          </Button>
          <Button
            variant={activeTab === 'logs' ? 'solid' : 'outlined'}
            onClick={() => setActiveTab('logs')}
            sx={{ fontWeight: 'normal' }}
          >
            📋 Server Logs
          </Button>
          <Button
            variant={activeTab === 'debug' ? 'solid' : 'outlined'}
            onClick={() => setActiveTab('debug')}
            sx={{ fontWeight: 'normal' }}
          >
            🔍 Debug Images
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert color="danger" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {apiStatus === 'connected' ? (
        <Box>
          {activeTab === 'app' && (
            <>
              <ScriptForm onScriptCreated={handleScriptCreated} />
              
              {scripts.length > 0 && (
                <>
                  <Divider sx={{ my: 4 }} />
                  <Box sx={{ mb: 4 }}>
                    <FormControl sx={{ maxWidth: 500 }}>
                      <FormLabel sx={{ fontWeight: 'normal' }}>Select Existing Script</FormLabel>
                      <Select
                        value={currentScript?._id || ''}
                        onChange={(event, newValue) => {
                          const selectedScript = scripts.find(script => script._id === newValue);
                          setCurrentScript(selectedScript);
                        }}
                        placeholder="Choose a script to view..."
                      >
                        {scripts.map((script) => (
                          <Option key={script._id} value={script._id}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                              <Typography sx={{ fontWeight: 'normal' }}>{script.title}</Typography>
                              <Typography level="body-xs" color="neutral">
                                {new Date(script.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Option>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </>
              )}
              
              {currentScript && (
                <>
                  <Divider sx={{ my: 4 }} />
                  <ScriptViewer script={currentScript} />
                </>
              )}
            </>
          )}

          {activeTab === 'logs' && (
            <LogsViewer />
          )}

          {activeTab === 'debug' && (
            <ImageDebugger />
          )}
        </Box>
      ) : (
        <Alert color="warning" sx={{ textAlign: 'center' }}>
          <Typography level="title-md">
            Unable to connect to the server
          </Typography>
          <Typography level="body-md">
            Please make sure the backend server is running on port 5000
          </Typography>
        </Alert>
      )}
    </Container>
  );
}

export default App;
