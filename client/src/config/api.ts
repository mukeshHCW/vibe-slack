// API configuration
const isDevelopment = import.meta.env.DEV;

// Load config based on environment
const getApiConfig = () => {
  if (isDevelopment) {
    return {
      baseUrl: 'http://localhost:5000',
      socketUrl: 'http://localhost:5000'
    };
  }
  
  // Production - try to load from environment or use defaults
  const domain = import.meta.env.VITE_PROD_DOMAIN || 'eeg-vibe-slack.eastus.cloudapp.azure.com';
  const serverPort = import.meta.env.VITE_PROD_SERVER_PORT || '5000';
  
  return {
    baseUrl: `http://${domain}:${serverPort}`,
    socketUrl: `http://${domain}:${serverPort}`
  };
};

const config = getApiConfig();

export const API_BASE_URL = config.baseUrl;
export const SOCKET_URL = config.socketUrl;
