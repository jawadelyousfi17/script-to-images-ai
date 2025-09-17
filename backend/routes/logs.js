const express = require('express');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const router = express.Router();

// Get available log files
router.get('/files', (req, res) => {
  try {
    const logsDir = path.join(__dirname, '../logs');
    
    if (!fs.existsSync(logsDir)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(logsDir)
      .filter(file => file.endsWith('.log'))
      .map(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime,
          displayName: file.replace('.log', '').replace(/-/g, ' ').toUpperCase()
        };
      })
      .sort((a, b) => b.modified - a.modified);

    res.json({ files });
  } catch (error) {
    logger.error('LOGS_API', 'Error getting log files', { error: error.message });
    res.status(500).json({ error: 'Failed to get log files' });
  }
});

// Get log content
router.get('/content/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const { lines = 100, offset = 0 } = req.query;
    
    // Validate filename to prevent directory traversal
    if (!filename.match(/^[a-zA-Z0-9_-]+\.log$/)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(__dirname, '../logs', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Log file not found' });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const allLines = content.split('\n').filter(line => line.trim());
    
    // Get the requested slice of lines
    const startIndex = Math.max(0, allLines.length - parseInt(lines) - parseInt(offset));
    const endIndex = allLines.length - parseInt(offset);
    const requestedLines = allLines.slice(startIndex, endIndex);

    // Parse JSON logs if possible
    const parsedLines = requestedLines.map((line, index) => {
      try {
        const parsed = JSON.parse(line);
        return {
          id: startIndex + index,
          raw: line,
          parsed,
          timestamp: parsed.timestamp,
          level: parsed.level,
          category: parsed.category,
          message: parsed.message,
          data: parsed.data
        };
      } catch (e) {
        return {
          id: startIndex + index,
          raw: line,
          parsed: null,
          timestamp: null,
          level: 'INFO',
          category: 'RAW',
          message: line,
          data: null
        };
      }
    });

    res.json({
      filename,
      totalLines: allLines.length,
      returnedLines: parsedLines.length,
      lines: parsedLines
    });

    logger.info('LOGS_API', `Served ${parsedLines.length} lines from ${filename}`);
  } catch (error) {
    logger.error('LOGS_API', 'Error reading log file', { 
      filename: req.params.filename,
      error: error.message 
    });
    res.status(500).json({ error: 'Failed to read log file' });
  }
});

// Clear log file
router.delete('/content/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename
    if (!filename.match(/^[a-zA-Z0-9_-]+\.log$/)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(__dirname, '../logs', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Log file not found' });
    }

    // Clear the file content
    fs.writeFileSync(filePath, '');
    
    logger.info('LOGS_API', `Cleared log file: ${filename}`);
    res.json({ message: `Log file ${filename} cleared successfully` });
  } catch (error) {
    logger.error('LOGS_API', 'Error clearing log file', { 
      filename: req.params.filename,
      error: error.message 
    });
    res.status(500).json({ error: 'Failed to clear log file' });
  }
});

// Get real-time log stream (Server-Sent Events)
router.get('/stream/:filename', (req, res) => {
  const { filename } = req.params;
  
  // Validate filename
  if (!filename.match(/^[a-zA-Z0-9_-]+\.log$/)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const filePath = path.join(__dirname, '../logs', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Log file not found' });
  }

  // Set up Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Watch file for changes
  const watcher = fs.watchFile(filePath, { interval: 1000 }, (curr, prev) => {
    if (curr.mtime > prev.mtime) {
      // File was modified, read new content
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        const lastLine = lines[lines.length - 1];
        
        if (lastLine) {
          res.write(`data: ${JSON.stringify({ line: lastLine, timestamp: new Date().toISOString() })}\n\n`);
        }
      } catch (error) {
        res.write(`data: ${JSON.stringify({ error: 'Error reading file' })}\n\n`);
      }
    }
  });

  // Clean up on client disconnect
  req.on('close', () => {
    fs.unwatchFile(filePath);
  });

  logger.info('LOGS_API', `Started log stream for ${filename}`);
});

module.exports = router;
