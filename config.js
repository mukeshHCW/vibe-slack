/**
 * Configuration loader for EEG Vibe Slack
 * Loads configuration from environment variables with fallbacks
 */

// Load environment variables
const PROD_DOMAIN = process.env.PROD_DOMAIN || 'eeg-vibe-slack.eastus.cloudapp.azure.com';
const PROD_VM_IP = process.env.PROD_VM_IP || '4.157.242.240';
const PROD_CLIENT_PORT = process.env.PROD_CLIENT_PORT || '3000';
const PROD_SERVER_PORT = process.env.PROD_SERVER_PORT || '5000';

// Development URLs
const DEV_CLIENT_URL = 'http://localhost:3000';
const DEV_SERVER_URL = 'http://localhost:5000';

// Production URLs
const PROD_CLIENT_URL = `http://${PROD_DOMAIN}:${PROD_CLIENT_PORT}`;
const PROD_SERVER_URL = `http://${PROD_DOMAIN}:${PROD_SERVER_PORT}`;
const PROD_CLIENT_IP_URL = `http://${PROD_VM_IP}:${PROD_CLIENT_PORT}`;
const PROD_SERVER_IP_URL = `http://${PROD_VM_IP}:${PROD_SERVER_PORT}`;

// CORS Origins
const CORS_ORIGINS = [
  DEV_CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  PROD_CLIENT_URL,
  PROD_CLIENT_IP_URL,
  'http://10.0.0.4:3000' // Internal VM IP
];

module.exports = {
  development: {
    client: DEV_CLIENT_URL,
    server: DEV_SERVER_URL,
    corsOrigins: [DEV_CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174']
  },
  production: {
    client: PROD_CLIENT_URL,
    server: PROD_SERVER_URL,
    clientIP: PROD_CLIENT_IP_URL,
    serverIP: PROD_SERVER_IP_URL,
    domain: PROD_DOMAIN,
    vmIP: PROD_VM_IP,
    corsOrigins: CORS_ORIGINS
  },
  ports: {
    client: PROD_CLIENT_PORT,
    server: PROD_SERVER_PORT
  },
  azure: {
    resourceGroup: process.env.AZURE_RESOURCE_GROUP || 'vibe-slack-rg',
    vmName: process.env.AZURE_VM_NAME || 'vibe-slack-vm',
    nsgName: process.env.AZURE_NSG_NAME || 'vibe-slack-vmNSG'
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  }
};
