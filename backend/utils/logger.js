const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.ensureLogsDirectory();
  }

  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  formatLogEntry(level, category, message, data = null) {
    const timestamp = this.formatTimestamp();
    const logEntry = {
      timestamp,
      level,
      category,
      message,
      ...(data && { data })
    };
    
    return JSON.stringify(logEntry);
  }

  writeToFile(filename, logEntry) {
    const filePath = path.join(this.logsDir, filename);
    const logLine = logEntry + '\n';
    
    fs.appendFileSync(filePath, logLine);
  }

  // General logging methods
  info(category, message, data = null) {
    const logEntry = this.formatLogEntry('INFO', category, message, data);
    console.log(`ℹ️  [${category}] ${message}`, data ? data : '');
    this.writeToFile('app.log', logEntry);
  }

  error(category, message, data = null) {
    const logEntry = this.formatLogEntry('ERROR', category, message, data);
    console.error(`❌ [${category}] ${message}`, data ? data : '');
    this.writeToFile('error.log', logEntry);
    this.writeToFile('app.log', logEntry);
  }

  warn(category, message, data = null) {
    const logEntry = this.formatLogEntry('WARN', category, message, data);
    console.warn(`⚠️  [${category}] ${message}`, data ? data : '');
    this.writeToFile('app.log', logEntry);
  }

  debug(category, message, data = null) {
    const logEntry = this.formatLogEntry('DEBUG', category, message, data);
    console.log(`🐛 [${category}] ${message}`, data ? data : '');
    this.writeToFile('debug.log', logEntry);
  }

  // Specific logging methods
  logRequest(req, res, responseTime) {
    const requestData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || 0
    };

    const message = `${req.method} ${req.originalUrl} - ${res.statusCode} (${responseTime}ms)`;
    const logEntry = this.formatLogEntry('REQUEST', 'HTTP', message, requestData);
    
    console.log(`🌐 [HTTP] ${message}`);
    this.writeToFile('requests.log', logEntry);
    this.writeToFile('app.log', logEntry);
  }

  logOpenAI(operation, model, prompt, response, duration, error = null) {
    const openaiData = {
      operation,
      model,
      promptLength: prompt ? prompt.length : 0,
      promptPreview: prompt ? prompt.substring(0, 100) + '...' : null,
      responseLength: response ? JSON.stringify(response).length : 0,
      duration: `${duration}ms`,
      success: !error,
      ...(error && { error: error.message })
    };

    const message = error 
      ? `OpenAI ${operation} failed: ${error.message}`
      : `OpenAI ${operation} completed (${duration}ms)`;
    
    const level = error ? 'ERROR' : 'INFO';
    const logEntry = this.formatLogEntry(level, 'OPENAI', message, openaiData);
    
    const emoji = error ? '❌' : '🤖';
    console.log(`${emoji} [OPENAI] ${message}`);
    
    this.writeToFile('openai.log', logEntry);
    this.writeToFile('app.log', logEntry);
  }

  logImageGeneration(chunkId, color, quality, style, imageUrl, duration, error = null) {
    const imageData = {
      chunkId,
      color,
      quality,
      style,
      imageUrl,
      duration: `${duration}ms`,
      success: !error,
      ...(error && { error: error.message })
    };

    const message = error 
      ? `Image generation failed for chunk ${chunkId}: ${error.message}`
      : `Image generated for chunk ${chunkId} (${duration}ms)`;
    
    const level = error ? 'ERROR' : 'INFO';
    const logEntry = this.formatLogEntry(level, 'IMAGE_GEN', message, imageData);
    
    const emoji = error ? '❌' : '🎨';
    console.log(`${emoji} [IMAGE_GEN] ${message}`);
    
    this.writeToFile('images.log', logEntry);
    this.writeToFile('app.log', logEntry);
  }

  logBatchJob(jobId, operation, data, error = null) {
    const batchData = {
      jobId,
      operation,
      ...data,
      success: !error,
      ...(error && { error: error.message })
    };

    const message = error 
      ? `Batch job ${operation} failed: ${error.message}`
      : `Batch job ${operation}: ${jobId}`;
    
    const level = error ? 'ERROR' : 'INFO';
    const logEntry = this.formatLogEntry(level, 'BATCH_JOB', message, batchData);
    
    const emoji = error ? '❌' : '📋';
    console.log(`${emoji} [BATCH_JOB] ${message}`);
    
    this.writeToFile('batch.log', logEntry);
    this.writeToFile('app.log', logEntry);
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
