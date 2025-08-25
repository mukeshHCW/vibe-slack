# Deployment Configuration

This directory contains configurable deployment scripts for EEG Vibe Slack.

## Files

### Configuration Files
- `.env.example` - Template for environment variables
- `.env.production` - Production environment configuration
- `config.js` - Main configuration loader

### Deployment Scripts
- `quick-deploy.bat` - Original deployment script (with hardcoded values)
- `quick-deploy-configurable.bat` - Configurable deployment script
- `setup-azure.js` - Azure NSG setup utility

## Usage

### For New Deployments

1. **Copy environment file:**
   ```cmd
   copy .env.example .env.production
   ```

2. **Edit `.env.production` with your values:**
   ```
   PROD_DOMAIN=your-vm-domain.cloudapp.azure.com
   PROD_VM_IP=your.vm.ip.address
   PROD_CLIENT_PORT=3000
   PROD_SERVER_PORT=5000
   ```

3. **Deploy using configurable script:**
   ```cmd
   curl -L -o quick-deploy-configurable.bat https://raw.githubusercontent.com/mukeshHCW/vibe-slack/master/quick-deploy-configurable.bat
   quick-deploy-configurable.bat
   ```

### For Azure NSG Setup

1. **Setup Azure firewall rules:**
   ```cmd
   node deployment/setup-azure.js
   ```

This will output the Azure CLI commands needed to open the required ports.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PROD_DOMAIN` | Your Azure VM domain | `eeg-vibe-slack.eastus.cloudapp.azure.com` |
| `PROD_VM_IP` | Your Azure VM public IP | `4.157.242.240` |
| `PROD_CLIENT_PORT` | Client application port | `3000` |
| `PROD_SERVER_PORT` | Server API port | `5000` |
| `AZURE_RESOURCE_GROUP` | Azure resource group name | `vibe-slack-rg` |
| `AZURE_VM_NAME` | Azure VM name | `vibe-slack-vm` |
| `AZURE_NSG_NAME` | Azure NSG name | `vibe-slack-vmNSG` |

## Benefits

- ✅ **No hardcoded values** in code
- ✅ **Easy to customize** for different deployments  
- ✅ **Environment-specific configurations**
- ✅ **Reusable deployment scripts**
- ✅ **Better security practices**
