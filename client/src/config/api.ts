// API configuration
const isDevelopment = import.meta.env.DEV;

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000'
  : window.location.origin;

export const SOCKET_URL = isDevelopment
  ? 'http://localhost:5000'
  : window.location.origin;
