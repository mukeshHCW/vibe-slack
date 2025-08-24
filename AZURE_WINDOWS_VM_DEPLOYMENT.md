# Vibe Slack - Azure Windows VM Deployment Guide

## Why Azure Windows VM?
- **Environment Consistency**: Same Windows environment as development
- **Full Control**: Complete control over server configuration
- **Easy Management**: Familiar Windows interface and tools
- **PowerShell Support**: Use same PowerShell commands as local dev
- **Cost-Effective**: Multiple budget-friendly options for demos

## VM Size Options for Demo (4-5 Users)

### 🎯 **Recommended: Standard_B1s** (Best Value)
- **vCPUs**: 1
- **RAM**: 1 GB
- **Cost**: ~$8/month (Pay-as-you-go)
- **Cost**: ~$3/month (Reserved 1-year)
- **Perfect for**: Demo, 4-5 concurrent users
- **Performance**: Sufficient for chat app with JSON storage

### 💡 **Alternative: Standard_B1ms** (Slightly Better)
- **vCPUs**: 1
- **RAM**: 2 GB
- **Cost**: ~$15/month (Pay-as-you-go)
- **Cost**: ~$6/month (Reserved 1-year)
- **Perfect for**: Demo with some headroom

### ⚡ **Budget Option: Azure Spot VMs** (80% Discount!)
- **Standard_B1s Spot**: ~$2/month
- **Standard_B1ms Spot**: ~$3/month
- **Risk**: Can be evicted if Azure needs capacity
- **Perfect for**: Development and demos

### 🆓 **FREE Option: Azure Free Tier**
- **B1S for 12 months FREE** (750 hours/month)
- **Perfect for**: Initial testing and demos
- **Limitation**: Only for new Azure accounts

## Prerequisites
- Azure CLI or Azure Portal access
- Remote Desktop client
- **GitHub account and repository**
- **Git configured locally**
- Your Vibe Slack application code

## Step 0: Setup GitHub Repository & Deployment Pipeline

### Create GitHub Repository
1. **Create New Repository**:
   - Go to GitHub.com → New Repository
   - Name: `vibe-slack-chat`
   - Description: `Slack-like chat application with real-time messaging`
   - Set to **Public** (or Private if preferred)
   - Initialize with README: ✅

### Setup Local Git Repository
```powershell
# Navigate to your project directory
cd "C:\Users\mukkum\OneDrive - Microsoft\Dev Box Files\Vibe Slack"

# Initialize git (if not already done)
git init

# Add GitHub remote (replace with your username)
git remote add origin https://github.com/YOUR-USERNAME/vibe-slack-chat.git

# Create .gitignore file
@"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
client/dist/
server/public/

# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# VS Code
.vscode/
!.vscode/extensions.json

# Data files (keep structure, ignore content)
server/data/*.json
!server/data/.gitkeep

# Temporary files
*.tmp
*.temp
"@ | Out-File -FilePath ".gitignore" -Encoding utf8

# Create data directory structure for deployment
New-Item -ItemType Directory -Path "server\data" -Force
New-Item -ItemType File -Path "server\data\.gitkeep" -Force
```

### Initial Commit and Push
```powershell
# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Vibe Slack chat application

- React frontend with Socket.IO
- Node.js/Express backend  
- Real-time messaging and channels
- User authentication with JWT
- Azure deployment ready"

# Push to GitHub
git push -u origin main
```

### Setup Deployment Branch Strategy
```powershell
# Create production branch for stable deployments
git checkout -b production
git push -u origin production

# Switch back to main for development
git checkout main
```

## Step 1: Create Azure Windows VM

### Option A: Using Azure CLI (PowerShell)
```powershell
# Login to Azure
az login

# Create resource group
az group create --name vibe-slack-rg --location eastus

# Create Windows VM (Budget Option - B1s)
az vm create `
  --resource-group vibe-slack-rg `
  --name vibe-slack-vm `
  --image Win2022Datacenter `
  --admin-username azureuser `
  --admin-password "YourSecurePassword123!" `
  --size Standard_B1s `
  --location eastus

# Alternative: Create Spot VM (80% cheaper)
az vm create `
  --resource-group vibe-slack-rg `
  --name vibe-slack-vm-spot `
  --image Win2022Datacenter `
  --admin-username azureuser `
  --admin-password "YourSecurePassword123!" `
  --size Standard_B1s `
  --priority Spot `
  --max-price 0.02 `
  --location eastus

# Open ports for web traffic and RDP
az vm open-port --port 80 --resource-group vibe-slack-rg --name vibe-slack-vm --priority 1000
az vm open-port --port 443 --resource-group vibe-slack-rg --name vibe-slack-vm --priority 1001
az vm open-port --port 5000 --resource-group vibe-slack-rg --name vibe-slack-vm --priority 1002
az vm open-port --port 3389 --resource-group vibe-slack-rg --name vibe-slack-vm --priority 900

# Get public IP
az vm show --resource-group vibe-slack-rg --name vibe-slack-vm --show-details --query publicIps --output tsv
```

### Option B: Using Azure Portal
1. Go to Azure Portal → Create Resource → Virtual Machine
2. **Basics**:
   - Resource Group: `vibe-slack-rg`
   - VM Name: `vibe-slack-vm`
   - Region: `East US`
   - Image: `Windows Server 2022 Datacenter`
   - Size: `Standard_B1s` (1 vCPU, 1GB RAM) - **$8/month**
   - Username: `azureuser`
   - Password: Your secure password
3. **Networking**: Allow RDP (3389), HTTP (80), HTTPS (443)
4. **Review + Create**

## Step 2: Connect to VM

1. **Get Connection Info**:
   ```powershell
   # Get public IP
   az vm show --resource-group vibe-slack-rg --name vibe-slack-vm --show-details --query publicIps --output tsv
   ```

2. **Connect via RDP**:
   - Open Remote Desktop Connection
   - Computer: `[VM-PUBLIC-IP]`
   - Username: `azureuser`
   - Password: `[Your-Password]`

## Step 3: Setup Development Environment on VM

### Install Required Software
```powershell
# Run these commands in PowerShell as Administrator on the VM

# 1. Install Chocolatey (Package Manager)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 2. Install Node.js
choco install nodejs -y

# 3. Install Git
choco install git -y

# 4. Install VS Code (optional, for editing)
choco install vscode -y

# 5. Refresh environment variables
refreshenv
```

### Verify Installation
```powershell
node --version
npm --version
git --version
```

## Step 4: Deploy Your Application from GitHub

### Clone Repository on VM
```powershell
# Navigate to desired directory
cd C:\

# Clone your GitHub repository (replace with your repo URL)
git clone https://github.com/YOUR-USERNAME/vibe-slack-chat.git
cd vibe-slack-chat

# Checkout production branch for stable deployment
git checkout production
```

### Setup Deployment Script
```powershell
# Create deployment script for easy updates
@"
# Vibe Slack Deployment Script
Write-Host "Starting Vibe Slack Deployment..." -ForegroundColor Green

# Pull latest changes
Write-Host "Pulling latest code..." -ForegroundColor Yellow
git fetch origin
git checkout production
git pull origin production

# Install server dependencies
Write-Host "Installing server dependencies..." -ForegroundColor Yellow
cd server
npm install --production

# Install client dependencies and build
Write-Host "Building client..." -ForegroundColor Yellow
cd ..\client
npm install
npm run build

# Copy built files to server public directory
Write-Host "Copying built files..." -ForegroundColor Yellow
if (Test-Path "..\server\public") {
    Remove-Item "..\server\public" -Recurse -Force
}
New-Item -ItemType Directory -Path "..\server\public" -Force
Copy-Item -Path "dist\*" -Destination "..\server\public\" -Recurse -Force

# Restart application
Write-Host "Restarting application..." -ForegroundColor Yellow
cd ..\server
pm2 restart vibe-slack

# Show status
Write-Host "Deployment complete! Application status:" -ForegroundColor Green
pm2 status
pm2 logs vibe-slack --lines 10
"@ | Out-File -FilePath "C:\Scripts\deploy-vibe-slack.ps1" -Encoding utf8

# Create Scripts directory
New-Item -ItemType Directory -Path "C:\Scripts" -Force

# Make script executable
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

### Initial Application Setup
```powershell
# Install server dependencies
cd server
npm install --production

# Install client dependencies and build
cd ..\client
npm install
npm run build

# Copy built files to server public directory
New-Item -ItemType Directory -Path "..\server\public" -Force
Copy-Item -Path "dist\*" -Destination "..\server\public\" -Recurse -Force

# Go back to server directory
cd ..\server
```

### Configure Environment Variables
```powershell
# Create production environment file
@"
NODE_ENV=production
JWT_SECRET=your-very-secure-random-string-here-$(Get-Random -Minimum 10000 -Maximum 99999)
PORT=5000
CORS_ORIGINS=http://[VM-PUBLIC-IP]:5000,https://[VM-PUBLIC-IP]:5000
"@ | Out-File -FilePath ".env" -Encoding utf8

# Note: Replace [VM-PUBLIC-IP] with actual VM public IP after deployment
```

## Step 5: Development to Production Workflow

### Local Development Workflow
```powershell
# 1. Make changes to your code locally
# 2. Test locally with npm run dev

# 3. Commit changes to main branch
git add .
git commit -m "Feature: Add new functionality"
git push origin main

# 4. When ready for production, merge to production branch
git checkout production
git merge main
git push origin production

# 5. Deploy to VM (run this on the VM)
C:\Scripts\deploy-vibe-slack.ps1
```

### Quick Deployment Commands (Run on VM)
```powershell
# Quick update deployment
cd C:\vibe-slack-chat
git pull origin production
C:\Scripts\deploy-vibe-slack.ps1

# Manual deployment steps (if script fails)
cd C:\vibe-slack-chat
git pull origin production
cd client && npm run build
Copy-Item -Path "dist\*" -Destination "..\server\public\" -Recurse -Force
cd ..\server && pm2 restart vibe-slack

# Check deployment status
pm2 status
pm2 logs vibe-slack --lines 20
```

### Automated Deployment (Optional Advanced Setup)
```powershell
# Create webhook listener script for GitHub webhooks
@"
# GitHub Webhook Deployment Script
# Place this in a separate Node.js webhook listener
const express = require('express');
const { exec } = require('child_process');
const app = express();

app.use(express.json());

app.post('/deploy', (req, res) => {
    if (req.body.ref === 'refs/heads/production') {
        console.log('Production deployment triggered');
        exec('powershell.exe -File C:\\Scripts\\deploy-vibe-slack.ps1', (error, stdout, stderr) => {
            if (error) {
                console.error('Deployment error:', error);
                return res.status(500).send('Deployment failed');
            }
            console.log('Deployment output:', stdout);
            res.send('Deployment successful');
        });
    } else {
        res.send('Not a production deployment');
    }
});

app.listen(3001, () => {
    console.log('Webhook listener running on port 3001');
});
"@ | Out-File -FilePath "C:\Scripts\webhook-deploy.js" -Encoding utf8
```

### Install PM2 for Process Management
```powershell
npm install -g pm2
npm install -g pm2-windows-service

# Configure PM2 as Windows Service
pm2-service-install
pm2-service-start
```

## Step 5: Start Your Application

### Start with PM2
```powershell
# Start the application
pm2 start index.production.js --name "vibe-slack"

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs vibe-slack
```

### Configure Windows Firewall
```powershell
# Allow Node.js through Windows Firewall
New-NetFirewallRule -DisplayName "Node.js App" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

## Step 6: Setup IIS Reverse Proxy (Optional)

For professional deployment, setup IIS as reverse proxy:

### Install IIS and URL Rewrite
```powershell
# Enable IIS
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpRedirect, IIS-ApplicationDevelopment, IIS-NetFxExtensibility45, IIS-HealthAndDiagnostics, IIS-HttpLogging, IIS-Security, IIS-RequestFiltering, IIS-Performance, IIS-WebServerManagementTools, IIS-ManagementConsole, IIS-IIS6ManagementCompatibility, IIS-Metabase

# Install URL Rewrite Module (download from Microsoft)
# https://www.iis.net/downloads/microsoft/url-rewrite
```

### Configure IIS
1. Open IIS Manager
2. Create new site:
   - Site name: `vibe-slack`
   - Physical path: `C:\vibe-slack\server\public`
   - Port: `80`
3. Add URL Rewrite rules to proxy API calls to `localhost:5000`

## Step 7: Testing and Verification

### Test Your Application
```powershell
# Test locally on VM
Start-Process "http://localhost:5000"

# Test from external (replace with VM public IP)
Start-Process "http://[VM-PUBLIC-IP]:5000"
```

### Monitor Application
```powershell
# Check PM2 status
pm2 status

# View logs
pm2 logs vibe-slack

# Restart if needed
pm2 restart vibe-slack
```

## Step 8: Setup Auto-Shutdown (Save 70% Costs!)

### Configure Auto-Shutdown via Azure CLI
```powershell
# Auto-shutdown at 10 PM EST daily
az vm auto-shutdown -g vibe-slack-rg -n vibe-slack-vm --time 2200 --timezone "Eastern Standard Time"

# Auto-shutdown weekends only (Friday 6 PM to Monday 8 AM)
az vm auto-shutdown -g vibe-slack-rg -n vibe-slack-vm --time 1800 --timezone "Eastern Standard Time"
```

### Configure Auto-Shutdown via Azure Portal
1. Go to your VM in Azure Portal
2. Select "Auto-shutdown" from left menu
3. Enable auto-shutdown
4. Set time: 10:00 PM
5. Set timezone: Your local timezone
6. Add notification email (optional)
7. Save

### Manual Start/Stop for Demos
```powershell
# Start VM before demo
az vm start --resource-group vibe-slack-rg --name vibe-slack-vm

# Stop VM after demo (saves money immediately)
az vm deallocate --resource-group vibe-slack-rg --name vibe-slack-vm

# Check VM status
az vm get-instance-view --resource-group vibe-slack-rg --name vibe-slack-vm --query instanceView.statuses[1] --output table
```

## Step 9: Security Hardening

### Configure Security
```powershell
# Update Windows
Install-Module PSWindowsUpdate -Force
Get-WUInstall -AcceptAll -AutoReboot

# Configure automatic updates
# Disable unnecessary services
# Configure Windows Defender
```

### SSL Configuration (Optional)
- Obtain SSL certificate (Let's Encrypt or paid)
- Configure IIS for HTTPS
- Update firewall rules for port 443

## Step 9: Backup and Monitoring

### Setup Backup
```powershell
# Create backup script
@"
# Backup application data
$backupPath = "C:\Backups\vibe-slack-$(Get-Date -Format 'yyyy-MM-dd-HH-mm')"
New-Item -ItemType Directory -Path $backupPath -Force
Copy-Item -Path "C:\vibe-slack\server\data\*" -Destination "$backupPath\data\" -Recurse -Force
Compress-Archive -Path $backupPath -DestinationPath "$backupPath.zip"
Remove-Item -Path $backupPath -Recurse -Force
"@ | Out-File -FilePath "C:\Scripts\backup-vibe-slack.ps1" -Encoding utf8

# Schedule backup task
schtasks /create /tn "Vibe Slack Backup" /tr "powershell.exe -File C:\Scripts\backup-vibe-slack.ps1" /sc daily /st 02:00
```

## Step 12: Maintenance Commands

### Repository Structure
```
vibe-slack-chat/
├── client/                 # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Node.js backend  
│   ├── data/              # JSON data files (gitignored content)
│   │   └── .gitkeep       # Keeps directory in git
│   ├── index.js           # Development server
│   ├── index.production.js # Production server
│   └── package.json
├── docs/                  # Documentation
├── scripts/              # Deployment scripts
├── .gitignore
├── Dockerfile
├── README.md
└── AZURE_WINDOWS_VM_DEPLOYMENT.md
```

### Branch Strategy
- **main**: Development branch
- **production**: Stable deployment branch
- **feature/***: Feature development branches

### Release Process
```powershell
# 1. Create feature branch
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add new feature"
git push origin feature/new-feature

# 2. Create pull request on GitHub (main ← feature/new-feature)

# 3. After review, merge to main
git checkout main
git pull origin main

# 4. Test on main, then promote to production
git checkout production
git merge main
git push origin production

# 5. Deploy on VM
# (Run on VM) C:\Scripts\deploy-vibe-slack.ps1
```

### Environment-Specific Configuration
```powershell
# Add to server/config/environments.js
module.exports = {
  development: {
    port: 5000,
    cors: ['http://localhost:5174'],
    jwtSecret: 'dev-secret'
  },
  production: {
    port: process.env.PORT || 5000,
    cors: process.env.CORS_ORIGINS?.split(',') || [],
    jwtSecret: process.env.JWT_SECRET
  }
};
```

### Application Management
```powershell
# View application status
pm2 status

# Restart application
pm2 restart vibe-slack

# Update application
cd C:\vibe-slack
git pull
cd client
npm run build
Copy-Item -Path "dist\*" -Destination "..\server\public\" -Recurse -Force
cd ..\server
pm2 restart vibe-slack

# View logs
pm2 logs vibe-slack --lines 100
```

### System Management
```powershell
# Check system resources
Get-Counter "\Processor(_Total)\% Processor Time"
Get-Counter "\Memory\Available MBytes"

# Check disk space
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace

# Check network connections
netstat -an | findstr :5000
```

## Scaling and Performance

### Performance Optimization for B1s
- **Enable Swap File**: Increase virtual memory for 1GB RAM
- **Optimize Node.js**: Use `--max-old-space-size=512` flag
- **Minimize Background Apps**: Disable unnecessary Windows services
- **Use PM2 Clustering**: Start multiple Node.js processes (but limit to 1-2 for B1s)

### When to Upgrade VM Size
- **B1s**: 1-5 concurrent users
- **B1ms**: 5-10 concurrent users  
- **B2s**: 10-20 concurrent users
- **Monitor**: Use Azure metrics to track CPU/Memory usage

### Monitoring
- **Azure Monitor**: Enable VM insights
- **Application Insights**: Add to Node.js app
- **Custom Metrics**: Monitor PM2 processes

## Cost Optimization

### VM Cost Management (Demo Budget Options)
- **Standard_B1s**: ~$8/month (demo perfect)
- **Standard_B1s Reserved**: ~$3/month (1-year commitment)
- **Standard_B1s Spot**: ~$2/month (80% discount, eviction risk)
- **Azure Free Tier**: FREE for 12 months (new accounts)

### Additional Cost Savings
- **Auto-shutdown**: Schedule VM shutdown during off-hours (save 70%)
- **Deallocate when not in use**: Stop VM completely to avoid compute charges
- **Managed Disks**: Use Standard HDD (cheaper than SSD for demos)

### Monthly Cost Breakdown (B1s)
```
VM Compute (Standard_B1s): $8/month
Managed Disk (32GB): $1.5/month
Public IP: $3/month
Network (minimal traffic): $1/month
Total: ~$13.50/month
```

### Cost with Auto-Shutdown (12 hours/day)
```
VM Compute: $4/month (50% savings)
Other costs: $5.50/month
Total: ~$9.50/month
```

## Troubleshooting

### Common Issues
1. **Application won't start**: Check PM2 logs and Node.js version
2. **Can't connect externally**: Verify NSG and Windows Firewall rules
3. **Performance issues**: Check VM size and resource usage
4. **SSL issues**: Verify certificate installation and IIS configuration

Your Vibe Slack application is now ready for production deployment on Azure Windows VM with the same environment consistency as your development machine!
