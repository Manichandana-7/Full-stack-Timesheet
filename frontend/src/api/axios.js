// src/api/axios.js
import axios from 'axios';

// Create a custom Axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true // Common API base URL
});

// Interceptor to add JWT token to request headers


export default api; // Export custom Axios instance
