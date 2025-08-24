# Azure VM Deployment Script for Vibe Slack Chat App
# This script creates a Windows VM and deploys the chat application

param(
    [string]$ResourceGroupName = "vibe-slack-rg",
    [string]$Location = "East US",
    [string]$VMName = "vibe-slack-vm",
    [string]$VMSize = "Standard_B2s",
    [string]$AdminUsername = "azureuser"
)

Write-Host "=== Azure VM Deployment for Vibe Slack Chat App ===" -ForegroundColor Green

# Check if logged into Azure
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
try {
    $account = az account show --query name -o tsv 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Please login to Azure first:" -ForegroundColor Red
        Write-Host "az login" -ForegroundColor Cyan
        exit 1
    }
    Write-Host "Logged in as: $account" -ForegroundColor Green
} catch {
    Write-Host "Please install and login to Azure CLI first" -ForegroundColor Red
    Write-Host "Download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Cyan
    exit 1
}

# Create Resource Group
Write-Host "Creating resource group: $ResourceGroupName" -ForegroundColor Yellow
az group create --name $ResourceGroupName --location $Location

# Create VM with password authentication
Write-Host "Creating Windows VM: $VMName" -ForegroundColor Yellow
Write-Host "VM Size: $VMSize" -ForegroundColor Cyan
Write-Host "This will take several minutes..." -ForegroundColor Cyan

$password = Read-Host "Enter password for admin user ($AdminUsername)" -AsSecureString
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

$vmResult = az vm create `
    --resource-group $ResourceGroupName `
    --name $VMName `
    --image "Win2019Datacenter" `
    --size $VMSize `
    --admin-username $AdminUsername `
    --admin-password $plainPassword `
    --public-ip-sku Standard `
    --output json

if ($LASTEXITCODE -eq 0) {
    $vm = $vmResult | ConvertFrom-Json
    $publicIP = $vm.publicIpAddress
    Write-Host "VM Created Successfully!" -ForegroundColor Green
    Write-Host "Public IP: $publicIP" -ForegroundColor Cyan
    
    # Open ports for the application
    Write-Host "Opening ports for the chat application..." -ForegroundColor Yellow
    az vm open-port --resource-group $ResourceGroupName --name $VMName --port 3000 --priority 1000
    az vm open-port --resource-group $ResourceGroupName --name $VMName --port 3001 --priority 1001
    az vm open-port --resource-group $ResourceGroupName --name $VMName --port 80 --priority 1002
    az vm open-port --resource-group $ResourceGroupName --name $VMName --port 443 --priority 1003
    
    Write-Host "`n=== VM CREATED SUCCESSFULLY ===" -ForegroundColor Green
    Write-Host "VM Name: $VMName" -ForegroundColor Cyan
    Write-Host "Public IP: $publicIP" -ForegroundColor Cyan
    Write-Host "Username: $AdminUsername" -ForegroundColor Cyan
    Write-Host "Password: [Hidden]" -ForegroundColor Cyan
    Write-Host "`nNext Steps:" -ForegroundColor Yellow
    Write-Host "1. RDP to the VM: mstsc /v:$publicIP" -ForegroundColor White
    Write-Host "2. Run the setup script on the VM" -ForegroundColor White
    Write-Host "`nYour chat app will be available at:" -ForegroundColor Green
    Write-Host "http://$publicIP:3000" -ForegroundColor Cyan
    
    # Save connection info
    $connectionInfo = @{
        PublicIP = $publicIP
        Username = $AdminUsername
        VMName = $VMName
        ResourceGroup = $ResourceGroupName
        ChatURL = "http://$publicIP:3000"
        ServerURL = "http://$publicIP:3001"
    }
    
    $connectionInfo | ConvertTo-Json | Out-File "vm-connection-info.json"
    Write-Host "`nConnection info saved to: vm-connection-info.json" -ForegroundColor Green
    
} else {
    Write-Host "Failed to create VM" -ForegroundColor Red
    exit 1
}
