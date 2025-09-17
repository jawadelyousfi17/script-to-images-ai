import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Select,
  Option,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Alert,
  Chip,
  Divider,
  Switch,
  IconButton,
} from '@mui/joy';
import { scriptAPI } from '../services/api';

const LogsViewer = () => {
  const [logFiles, setLogFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [logContent, setLogContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [linesCount, setLinesCount] = useState(100);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [totalLines, setTotalLines] = useState(0);
  const logContainerRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Load available log files
  useEffect(() => {
    loadLogFiles();
  }, []);

  // Auto-refresh logs
  useEffect(() => {
    let interval;
    if (autoRefresh && selectedFile) {
      interval = setInterval(() => {
        loadLogContent(selectedFile, false);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedFile, linesCount]);

  // Real-time log streaming
  useEffect(() => {
    if (realTimeEnabled && selectedFile) {
      startRealTimeStream();
    } else {
      stopRealTimeStream();
    }

    return () => stopRealTimeStream();
  }, [realTimeEnabled, selectedFile]);

  const loadLogFiles = async () => {
    try {
      const response = await scriptAPI.logs.getFiles();
      setLogFiles(response.files || []);
      if (response.files && response.files.length > 0 && !selectedFile) {
        setSelectedFile(response.files[0].name);
      }
    } catch (err) {
      setError('Failed to load log files');
      console.error('Error loading log files:', err);
    }
  };

  const loadLogContent = async (filename, showLoading = true) => {
    if (!filename) return;

    if (showLoading) setLoading(true);
    setError('');

    try {
      const response = await scriptAPI.logs.getContent(filename, linesCount);
      setLogContent(response.lines || []);
      setTotalLines(response.totalLines || 0);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
      }, 100);
    } catch (err) {
      setError(`Failed to load log content: ${err.response?.data?.error || err.message}`);
      console.error('Error loading log content:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const startRealTimeStream = () => {
    if (!selectedFile) return;

    stopRealTimeStream();
    
    const streamUrl = scriptAPI.logs.getStreamUrl(selectedFile);
    eventSourceRef.current = new EventSource(streamUrl);
    
    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.line) {
          // Parse the new log line
          let parsedLine;
          try {
            const parsed = JSON.parse(data.line);
            parsedLine = {
              id: Date.now(),
              raw: data.line,
              parsed,
              timestamp: parsed.timestamp,
              level: parsed.level,
              category: parsed.category,
              message: parsed.message,
              data: parsed.data
            };
          } catch (e) {
            parsedLine = {
              id: Date.now(),
              raw: data.line,
              parsed: null,
              timestamp: data.timestamp,
              level: 'INFO',
              category: 'RAW',
              message: data.line,
              data: null
            };
          }

          setLogContent(prev => [...prev, parsedLine].slice(-linesCount));
          
          // Auto-scroll to bottom
          setTimeout(() => {
            if (logContainerRef.current) {
              logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
            }
          }, 50);
        }
      } catch (err) {
        console.error('Error parsing real-time log data:', err);
      }
    };

    eventSourceRef.current.onerror = (err) => {
      console.error('Real-time log stream error:', err);
      setRealTimeEnabled(false);
    };
  };

  const stopRealTimeStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const handleFileChange = (filename) => {
    setSelectedFile(filename);
    setRealTimeEnabled(false);
    loadLogContent(filename);
  };

  const handleClearLogs = async () => {
    if (!selectedFile) return;

    try {
      await scriptAPI.logs.clearFile(selectedFile);
      setLogContent([]);
      setTotalLines(0);
      setError('');
    } catch (err) {
      setError(`Failed to clear logs: ${err.response?.data?.error || err.message}`);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLevelColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR': return 'danger';
      case 'WARN': return 'warning';
      case 'INFO': return 'primary';
      case 'DEBUG': return 'neutral';
      case 'REQUEST': return 'success';
      default: return 'neutral';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card variant="outlined" sx={{ p: 4, mb: 4 }}>
      <Typography level="h3" sx={{ mb: 3, fontWeight: 'normal' }}>
        📋 Server Logs
      </Typography>

      {error && (
        <Alert color="danger" sx={{ mb: 3 }} variant="soft">
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr auto auto' }, gap: 2, alignItems: 'end', mb: 3 }}>
        <FormControl>
          <FormLabel sx={{ fontWeight: 'normal' }}>Log File</FormLabel>
          <Select
            value={selectedFile}
            onChange={(event, newValue) => handleFileChange(newValue)}
            placeholder="Select log file..."
          >
            {logFiles.map((file) => (
              <Option key={file.name} value={file.name}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Typography sx={{ fontWeight: 'normal' }}>{file.displayName}</Typography>
                  <Typography level="body-xs" color="neutral">
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>
              </Option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel sx={{ fontWeight: 'normal' }}>Lines</FormLabel>
          <Input
            type="number"
            value={linesCount}
            onChange={(e) => setLinesCount(parseInt(e.target.value) || 100)}
            size="sm"
            slotProps={{
              input: { min: 10, max: 1000, step: 10 }
            }}
          />
        </FormControl>

        <Box>
          <Typography level="body-xs" color="neutral" sx={{ mb: 0.5 }}>
            Total Lines
          </Typography>
          <Typography level="title-sm" sx={{ fontWeight: 'normal' }}>
            {totalLines.toLocaleString()}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="sm"
          onClick={() => loadLogContent(selectedFile)}
          loading={loading}
          disabled={!selectedFile}
          sx={{ fontWeight: 'normal' }}
        >
          Refresh
        </Button>

        <Button
          variant="outlined"
          size="sm"
          color="danger"
          onClick={handleClearLogs}
          disabled={!selectedFile}
          sx={{ fontWeight: 'normal' }}
        >
          Clear
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Switch
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            size="sm"
          />
          <Typography level="body-sm" sx={{ fontWeight: 'normal' }}>
            Auto-refresh (2s)
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Switch
            checked={realTimeEnabled}
            onChange={(e) => setRealTimeEnabled(e.target.checked)}
            size="sm"
          />
          <Typography level="body-sm" sx={{ fontWeight: 'normal' }}>
            Real-time stream
          </Typography>
        </Box>

        {(autoRefresh || realTimeEnabled) && (
          <Chip color="success" size="sm" variant="soft">
            Live
          </Chip>
        )}
      </Box>

      <Box
        ref={logContainerRef}
        sx={{
          height: '500px',
          overflow: 'auto',
          bgcolor: 'background.level1',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 'md',
          p: 2,
          fontFamily: 'monospace',
          fontSize: '13px',
          lineHeight: 1.4
        }}
      >
        {logContent.length === 0 ? (
          <Typography level="body-sm" color="neutral" sx={{ textAlign: 'center', py: 4 }}>
            {loading ? 'Loading logs...' : 'No log entries found'}
          </Typography>
        ) : (
          logContent.map((entry) => (
            <Box key={entry.id} sx={{ mb: 1, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Typography level="body-xs" color="neutral" sx={{ minWidth: '80px', fontFamily: 'monospace' }}>
                {formatTimestamp(entry.timestamp)}
              </Typography>
              
              <Chip
                size="sm"
                color={getLevelColor(entry.level)}
                variant="soft"
                sx={{ minWidth: '60px', fontSize: '10px' }}
              >
                {entry.level}
              </Chip>
              
              <Chip
                size="sm"
                color="neutral"
                variant="outlined"
                sx={{ minWidth: '80px', fontSize: '10px' }}
              >
                {entry.category}
              </Chip>
              
              <Typography
                level="body-sm"
                sx={{
                  flex: 1,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {entry.message}
                {entry.data && (
                  <Box sx={{ mt: 0.5, pl: 2, opacity: 0.8 }}>
                    {JSON.stringify(entry.data, null, 2)}
                  </Box>
                )}
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </Card>
  );
};

export default LogsViewer;
