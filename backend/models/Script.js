const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  startTime: {
    type: Number,
    required: true
  },
  endTime: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  topic: {
    type: String,
    default: null
  }
});

const scriptSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  originalScript: {
    type: String,
    required: true
  },
  chunks: [chunkSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

scriptSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Script', scriptSchema);
