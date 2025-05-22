// src/services/api.js - Updated to handle file uploads

import axios from 'axios';

const API_URL = 'http://localhost:8000/api/';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  
  // If the request data is FormData, don't set Content-Type
  // Let the browser set it automatically with the boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

export default apiClient;