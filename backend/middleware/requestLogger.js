const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request start
  logger.debug('HTTP', `Incoming ${req.method} ${req.originalUrl}`, {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log the completed request
    logger.logRequest(req, res, responseTime);
    
    // Call original end method
    originalEnd.call(res, chunk, encoding);
  };

  next();
};

module.exports = requestLogger;
