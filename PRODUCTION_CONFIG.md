# EEG Vibe Slack - Production Configuration

This file documents all production configuration changes made for Azure VM deployment.

## Changes Made

### 1. CORS Configuration (server/index.js)
- Added production domains to CORS origins:
  - `http://eeg-vibe-slack.eastus.cloudapp.azure.com:3000`
  - `http://10.0.0.4:3000` (internal VM IP)
  - `http://4.157.242.240:3000` (public IP)

### 2. API Configuration (client/src/config/api.ts)
- Updated production API URLs to point to port 5000
- Changed from `window.location.origin` to explicit server URL

### 3. Deployment Script (quick-deploy.bat)
- Added `refreshenv` command after Chocolatey installation
- Added `--ignore-scripts` for npm install to avoid circular dependencies
- Added TypeScript global installation
- Added Windows Firewall configuration for ports 3000 and 5000
- Fixed PM2 commands for proper service startup
- Updated final URLs to show both domain and IP access

### 4. Connection Info (vm-connection-info.json)
- Updated server URLs to use port 5000 instead of 3001

### 5. New Files Created
- `AZURE_VM_DEPLOYMENT_GUIDE.md` - Complete deployment documentation
- `api.production.ts` - Dedicated production API configuration

## Port Configuration
- **Client (Frontend):** Port 3000
- **Server (Backend):** Port 5000
- **Azure NSG Rules:** Both ports opened with appropriate priorities

## Environment Setup
- Windows Firewall: Automatically configured
- Azure NSG: May require manual setup for new deployments
- PM2: Used for process management and auto-restart

## Next Deployment
With these changes, future deployments should work smoothly with the single `quick-deploy.bat` script.
