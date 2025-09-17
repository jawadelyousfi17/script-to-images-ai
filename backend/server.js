const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const scriptRoutes = require('./routes/scripts');
const path = require('path');
const JobManager = require('./services/jobManager');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Serve static images
app.use('/api/images', express.static(path.join(__dirname, 'uploads')));

// Image download route
app.get('/api/images/:filename/download', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'uploads', filename);
  
  // Check if file exists
  if (!require('fs').existsSync(filepath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  
  // Set download headers
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'image/png');
  
  // Send file
  res.sendFile(filepath);
});

// Routes
app.use('/api/scripts', scriptRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Script Chunker API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize job manager
const jobManager = new JobManager();

// Make job manager available to routes
app.locals.jobManager = jobManager;

// Connect to MongoDB (Local)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/script-chunker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  logger.info('DATABASE', 'Connected to MongoDB successfully', {
    database: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port
  });
  
  // Start job processor
  await jobManager.startProcessor();
  logger.info('JOB_MANAGER', 'Job processor started successfully');
  
  // Start server
  app.listen(PORT, () => {
    logger.info('SERVER', `Server started successfully on port ${PORT}`, {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      healthCheck: `http://localhost:${PORT}/api/health`
    });
  });
})
.catch((error) => {
  logger.error('DATABASE', 'MongoDB connection failed', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('SERVER', 'Received SIGINT, shutting down gracefully');
  
  jobManager.stopProcessor();
  logger.info('JOB_MANAGER', 'Job processor stopped');
  
  mongoose.connection.close();
  logger.info('DATABASE', 'MongoDB connection closed');
  
  logger.info('SERVER', 'Server shutdown complete');
  process.exit(0);
});
