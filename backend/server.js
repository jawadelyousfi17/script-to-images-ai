const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const scriptRoutes = require('./routes/scripts');
const path = require('path');
const JobManager = require('./services/jobManager');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
  console.log('✅ Connected to MongoDB locally');
  console.log(`📍 Database: ${mongoose.connection.name}`);
  
  // Start job processor
  await jobManager.startProcessor();
  
  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🎨 Job processor is running`);
  });
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
  console.error('💡 Make sure MongoDB is running: sudo systemctl start mongod');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  jobManager.stopProcessor();
  mongoose.connection.close();
  process.exit(0);
});
