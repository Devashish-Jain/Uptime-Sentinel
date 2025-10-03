import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Request interceptor for debugging in development
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.MODE === 'development') {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.MODE === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 404) {
        throw new Error(data.message || 'Resource not found');
      } else if (status === 400) {
        throw new Error(data.message || 'Invalid request');
      } else if (status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(data.message || `HTTP ${status} Error`);
      }
    } else if (error.request) {
      // Network error
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      // Other error
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// API service methods
export const apiService = {
  // Health check
  async healthCheck() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all websites
  async getWebsites() {
    try {
      const response = await api.get('/websites');
      return response.data.data || []; // Return the data array
    } catch (error) {
      throw error;
    }
  },

  // Add a new website
  async addWebsite(websiteData) {
    try {
      const response = await api.post('/websites', websiteData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get website by ID
  async getWebsiteById(id) {
    try {
      const response = await api.get(`/websites/${id}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a website
  async deleteWebsite(id) {
    try {
      const response = await api.delete(`/websites/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update ping result (internal use)
  async updatePingResult(id, pingData) {
    try {
      const response = await api.put(`/websites/${id}/ping-result`, pingData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get detailed ping history for a website
  async getPingHistory(id, filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filters as query parameters
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.filterDate) params.append('filterDate', filters.filterDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const url = `/websites/${id}/ping-history${params.toString() ? '?' + params.toString() : ''}`;
      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  // Pause monitoring for a website
  async pauseWebsite(id) {
    try {
      const response = await api.put(`/websites/${id}/pause`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Resume monitoring for a website
  async resumeWebsite(id) {
    try {
      const response = await api.put(`/websites/${id}/resume`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Authentication methods
  
  // Sign up a new user
  async signup(userData) {
    try {
      const response = await api.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify email with verification code
  async verifyEmail(email, verificationCode) {
    try {
      const response = await api.post('/auth/verify-email', {
        email,
        verificationCode
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Resend verification email
  async resendVerificationEmail(email) {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check authentication status
  async checkAuthStatus() {
    try {
      const response = await api.get('/auth/status');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default apiService;
