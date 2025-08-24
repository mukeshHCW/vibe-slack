# Windows VM Setup Script for Vibe Slack Chat App
# Run this script on the Windows VM after RDP connection

param(
    [string]$GitHubRepo = "https://github.com/mukeshHCW/vibe-slack.git"
)

Write-Host "=== Setting up Vibe Slack Chat App on Windows VM ===" -ForegroundColor Green

# Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Install Chocolatey (Windows package manager)
Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    $env:PATH += ";C:\ProgramData\chocolatey\bin"
    refreshenv
} else {
    Write-Host "Chocolatey already installed" -ForegroundColor Green
}

# Install Node.js
Write-Host "Installing Node.js..." -ForegroundColor Yellow
choco install nodejs -y
refreshenv

# Install Git
Write-Host "Installing Git..." -ForegroundColor Yellow
choco install git -y
refreshenv

# Install PM2 globally for process management
Write-Host "Installing PM2..." -ForegroundColor Yellow
npm install -g pm2

# Create application directory
$appDir = "C:\vibe-slack"
Write-Host "Creating application directory: $appDir" -ForegroundColor Yellow
if (Test-Path $appDir) {
    Remove-Item $appDir -Recurse -Force
}
New-Item -ItemType Directory -Path $appDir

# Clone the repository
Write-Host "Cloning repository from GitHub..." -ForegroundColor Yellow
Set-Location $appDir
git clone $GitHubRepo .

# Install server dependencies
Write-Host "Installing server dependencies..." -ForegroundColor Yellow
Set-Location "$appDir\server"
npm install

# Install client dependencies
Write-Host "Installing client dependencies..." -ForegroundColor Yellow
Set-Location "$appDir\client"
npm install

# Build the client for production
Write-Host "Building client for production..." -ForegroundColor Yellow
npm run build

# Create data directory for server
Write-Host "Creating server data directory..." -ForegroundColor Yellow
$dataDir = "$appDir\server\data"
if (!(Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir
}

# Create initial data files
Write-Host "Creating initial data files..." -ForegroundColor Yellow

# Users file
$users = @()
$users | ConvertTo-Json | Out-File "$dataDir\users.json" -Encoding UTF8

# Channels file
$channels = @(
    @{
        id = [System.Guid]::NewGuid().ToString()
        name = "general"
        description = "General discussion"
        createdBy = "system"
        createdAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        members = @()
    }
)
$channels | ConvertTo-Json | Out-File "$dataDir\channels.json" -Encoding UTF8

# Messages file
$messages = @()
$messages | ConvertTo-Json | Out-File "$dataDir\messages.json" -Encoding UTF8

# Direct messages file
$directMessages = @()
$directMessages | ConvertTo-Json | Out-File "$dataDir\direct_messages.json" -Encoding UTF8

# User read status file
$userReadStatus = @()
$userReadStatus | ConvertTo-Json | Out-File "$dataDir\user_read_status.json" -Encoding UTF8

# Update client API configuration for production
Write-Host "Updating client configuration for production..." -ForegroundColor Yellow
$apiConfigPath = "$appDir\client\src\config\api.ts"
if (Test-Path $apiConfigPath) {
    $publicIP = (Invoke-WebRequest -Uri "http://ipinfo.io/ip" -UseBasicParsing).Content.Trim()
    $apiConfig = @"
const API_BASE_URL = 'http://$publicIP:3001';
const SOCKET_URL = 'http://$publicIP:3001';

export { API_BASE_URL, SOCKET_URL };
"@
    $apiConfig | Out-File $apiConfigPath -Encoding UTF8
    Write-Host "Updated API configuration with public IP: $publicIP" -ForegroundColor Green
}

# Create PM2 ecosystem file
Write-Host "Creating PM2 ecosystem configuration..." -ForegroundColor Yellow
$ecosystemConfig = @"
module.exports = {
  apps: [
    {
      name: 'vibe-slack-server',
      script: './server/index.js',
      cwd: 'C:/vibe-slack',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'vibe-slack-client',
      script: 'npx',
      args: 'serve -s build -l 3000',
      cwd: 'C:/vibe-slack/client',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
"@
$ecosystemConfig | Out-File "$appDir\ecosystem.config.js" -Encoding UTF8

# Install serve globally for serving the built client
Write-Host "Installing serve package for client..." -ForegroundColor Yellow
npm install -g serve

# Start the applications with PM2
Write-Host "Starting applications with PM2..." -ForegroundColor Yellow
Set-Location $appDir
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
Write-Host "Setting up PM2 to start on boot..." -ForegroundColor Yellow
pm2 startup

# Show application status
Write-Host "`n=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
pm2 status

$publicIP = (Invoke-WebRequest -Uri "http://ipinfo.io/ip" -UseBasicParsing).Content.Trim()
Write-Host "`nYour Vibe Slack Chat App is now running!" -ForegroundColor Green
Write-Host "Client URL: http://$publicIP:3000" -ForegroundColor Cyan
Write-Host "Server URL: http://$publicIP:3001" -ForegroundColor Cyan
Write-Host "`nApplication logs:" -ForegroundColor Yellow
Write-Host "pm2 logs vibe-slack-server" -ForegroundColor White
Write-Host "pm2 logs vibe-slack-client" -ForegroundColor White
Write-Host "`nTo restart applications:" -ForegroundColor Yellow
Write-Host "pm2 restart all" -ForegroundColor White
