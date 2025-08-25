# EEG Vibe Slack - Windows Data Recovery Utility
Write-Host "=== EEG Vibe Slack - Windows Data Recovery Utility ===" -ForegroundColor Green

# Change to server directory
Set-Location "C:\vibe-slack\server"

Write-Host "Checking data files for corruption..." -ForegroundColor Yellow

# Create backup directory with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "data_backup_$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Write-Host "Backing up current data files..." -ForegroundColor Yellow

# Backup existing files
if (Test-Path "data\users.json") {
    Copy-Item "data\users.json" "$backupDir\users.json.bak" -ErrorAction SilentlyContinue
}
if (Test-Path "data\channels.json") {
    Copy-Item "data\channels.json" "$backupDir\channels.json.bak" -ErrorAction SilentlyContinue
}
if (Test-Path "data\messages.json") {
    Copy-Item "data\messages.json" "$backupDir\messages.json.bak" -ErrorAction SilentlyContinue
}
if (Test-Path "data\direct_messages.json") {
    Copy-Item "data\direct_messages.json" "$backupDir\direct_messages.json.bak" -ErrorAction SilentlyContinue
}
if (Test-Path "data\user_read_status.json") {
    Copy-Item "data\user_read_status.json" "$backupDir\user_read_status.json.bak" -ErrorAction SilentlyContinue
}

Write-Host "Recreating data files with clean structure..." -ForegroundColor Yellow

# Create clean JSON files
@'
[
  {
    "id": "user_1",
    "username": "admin",
    "email": "admin@example.com",
    "avatar": "https://i.pravatar.cc/150?img=1"
  }
]
'@ | Out-File -FilePath "data\users.json" -Encoding UTF8

@'
[
  {
    "id": "general",
    "name": "general",
    "description": "General discussion channel",
    "members": ["user_1"],
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
'@ | Out-File -FilePath "data\channels.json" -Encoding UTF8

@'
[]
'@ | Out-File -FilePath "data\messages.json" -Encoding UTF8

@'
[]
'@ | Out-File -FilePath "data\direct_messages.json" -Encoding UTF8

@'
{}
'@ | Out-File -FilePath "data\user_read_status.json" -Encoding UTF8

Write-Host "" -ForegroundColor Green
Write-Host "Data files have been reset to clean state." -ForegroundColor Green
Write-Host "Your previous data has been backed up in: $backupDir" -ForegroundColor Green
Write-Host "" -ForegroundColor Green

Write-Host "Checking for Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Stopping existing Node.js processes..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

Write-Host "Starting the server..." -ForegroundColor Yellow

# Start the server using PM2 or directly with Node
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    Write-Host "Using PM2 to start server..." -ForegroundColor Green
    pm2 delete vibe-slack-server -ErrorAction SilentlyContinue
    pm2 start index.js --name vibe-slack-server
    pm2 save
} else {
    Write-Host "PM2 not found, starting with Node directly..." -ForegroundColor Yellow
    Start-Process -FilePath "node" -ArgumentList "index.js" -WorkingDirectory "C:\vibe-slack\server" -WindowStyle Hidden
}

Write-Host "" -ForegroundColor Green
Write-Host "Data recovery completed!" -ForegroundColor Green
Write-Host "Server should now be running on port 3001" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
