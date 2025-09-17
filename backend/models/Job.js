const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  scriptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Script',
    required: true
  },
  type: {
    type: String,
    enum: ['batch_image_generation'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'paused'],
    default: 'pending'
  },
  progress: {
    totalChunks: { type: Number, required: true },
    processedChunks: { type: Number, default: 0 },
    failedChunks: { type: Number, default: 0 }
  },
  config: {
    color: { type: String, default: 'white' },
    quality: { type: String, default: 'high' }
  },
  chunksToProcess: [{
    chunkId: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    error: String,
    processedAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  error: String
});

jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate completion percentage
jobSchema.virtual('completionPercentage').get(function() {
  if (this.progress.totalChunks === 0) return 100;
  return Math.round((this.progress.processedChunks / this.progress.totalChunks) * 100);
});

// Check if job is complete
jobSchema.virtual('isComplete').get(function() {
  return this.progress.processedChunks >= this.progress.totalChunks || this.status === 'completed';
});

jobSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);
