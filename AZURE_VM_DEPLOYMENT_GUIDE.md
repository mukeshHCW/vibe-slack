# EEG Vibe Slack - Azure VM Deployment Guide

## Quick Deployment

### Prerequisites
- Azure VM (Windows Server) with admin access
- RDP connection to the VM

### Automated Deployment Steps

1. **RDP to your Azure VM:**
   ```cmd
   mstsc /v:eeg-vibe-slack.eastus.cloudapp.azure.com
   ```

2. **Open Command Prompt as Administrator**

3. **Download and run the deployment script:**
   ```cmd
   curl -L -o quick-deploy.bat https://raw.githubusercontent.com/mukeshHCW/vibe-slack/master/quick-deploy.bat
   quick-deploy.bat
   ```

4. **Wait for deployment to complete** (10-15 minutes)

5. **Access your application:**
   - Client: http://eeg-vibe-slack.eastus.cloudapp.azure.com:3000
   - Server: http://eeg-vibe-slack.eastus.cloudapp.azure.com:5000

### What the script does:
- ✅ Installs Node.js, Git, and dependencies
- ✅ Configures Windows Firewall (ports 3000, 5000)
- ✅ Sets up CORS for production domains
- ✅ Creates data directories and initial files
- ✅ Builds and deploys both client and server
- ✅ Starts services with PM2 process manager

### Manual Azure Setup (if needed)

```powershell
# Create Azure Network Security Group rules
az network nsg rule create --resource-group vibe-slack-rg --nsg-name vibe-slack-vmNSG --name allow-http-3000 --protocol tcp --priority 1100 --destination-port-range 3000 --access allow --direction Inbound --source-address-prefix "*"

az network nsg rule create --resource-group vibe-slack-rg --nsg-name vibe-slack-vmNSG --name allow-http-5000 --protocol tcp --priority 1300 --destination-port-range 5000 --access allow --direction Inbound --source-address-prefix "*"
```

### Troubleshooting

**If you see CORS errors:**
- The updated code now includes all production domains in CORS configuration

**If ports are blocked:**
- Windows Firewall rules are automatically added by the script
- Azure NSG rules may need to be added manually (see commands above)

**If deployment fails:**
- Check that you're running Command Prompt as Administrator
- Ensure VM has internet connectivity
- Wait for .NET Framework installation to complete (can take 5-10 minutes)

### Production URLs
- **Client Application:** http://eeg-vibe-slack.eastus.cloudapp.azure.com:3000
- **API Server:** http://eeg-vibe-slack.eastus.cloudapp.azure.com:5000
- **VM RDP:** eeg-vibe-slack.eastus.cloudapp.azure.com
