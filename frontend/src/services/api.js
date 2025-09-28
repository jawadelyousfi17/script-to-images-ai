import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const scriptAPI = {
  // Create a new script
  createScript: async (title, script) => {
    const response = await api.post('/scripts', { title, script });
    return response.data;
  },

  // Get all scripts
  getScripts: async () => {
    const response = await api.get('/scripts');
    return response.data;
  },

  // Get a specific script
  getScript: async (id) => {
    const response = await api.get(`/scripts/${id}`);
    return response.data;
  },

  // Regenerate a chunk
  regenerateChunk: async (scriptId, chunkId, context = '') => {
    const response = await api.put(`/scripts/${scriptId}/chunks/${chunkId}/regenerate`, {
      context,
    });
    return response.data;
  },

  // Generate image for a chunk
  generateImage: async (scriptId, chunkId, color = 'white', quality = 'high', style = 'infographic', provider = 'openai') => {
    const response = await api.post(`/scripts/${scriptId}/chunks/${chunkId}/generate-image`, {
      color,
      quality,
      style,
      provider,
    });
    return response.data;
  },

  // Batch generate images for all chunks
  batchGenerateImages: async (scriptId, color = 'white', quality = 'high', style = 'infographic', provider = 'openai') => {
    const response = await api.post(`/scripts/${scriptId}/batch-generate-images`, {
      color,
      quality,
      style,
      provider,
    });
    return response.data;
  },

  // Get batch generation status
  getBatchStatus: async (scriptId) => {
    const response = await api.get(`/scripts/${scriptId}/batch-status`);
    return response.data;
  },

  // Cancel batch generation job
  cancelBatchJob: async (scriptId) => {
    const response = await api.post(`/scripts/${scriptId}/cancel-batch`);
    return response.data;
  },

  // Clear all jobs for a script (debug)
  clearAllJobs: async (scriptId) => {
    const response = await api.post(`/scripts/${scriptId}/clear-jobs`);
    return response.data;
  },

  // Generate YouTube metadata (title and description)
  generateYouTubeMetadata: async (scriptId, options = {}) => {
    const response = await api.post(`/scripts/${scriptId}/generate-youtube-metadata`, options);
    return response.data;
  },

  // Delete a script
  deleteScript: async (id) => {
    const response = await api.delete(`/scripts/${id}`);
    return response.data;
  },

  // Get available image providers
  getProviders: async () => {
    const response = await api.get('/scripts/providers');
    return response.data;
  },

  // Get account info for a provider
  getProviderAccount: async (provider) => {
    const response = await api.get(`/scripts/providers/${provider}/account`);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Logs API
  logs: {
    // Get available log files
    getFiles: async () => {
      const response = await api.get('/logs/files');
      return response.data;
    },

    // Get log content
    getContent: async (filename, lines = 100, offset = 0) => {
      const response = await api.get(`/logs/content/${filename}`, {
        params: { lines, offset }
      });
      return response.data;
    },

    // Clear log file
    clearFile: async (filename) => {
      const response = await api.delete(`/logs/content/${filename}`);
      return response.data;
    },

    // Get log stream URL for Server-Sent Events
    getStreamUrl: (filename) => {
      return `${API_BASE_URL}/logs/stream/${filename}`;
    }
  },
};

export default api;
