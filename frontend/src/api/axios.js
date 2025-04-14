// src/api/axios.js
import axios from 'axios';

// Create a custom Axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Common API base URL
});

// Interceptor to add JWT token to request headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Get token from localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Attach token to Authorization header
  }
  return config; // Return the modified config
});

export default api; // Export custom Axios instance
