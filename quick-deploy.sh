#!/bin/bash
# Quick Azure VM deployment for Vibe Slack
# Usage: ./quick-deploy.sh

echo "=== Quick Azure VM Deployment for Vibe Slack ==="

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Azure CLI is not installed. Please install it first:"
    echo "https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo "Please login to Azure first:"
    echo "az login"
    exit 1
fi

# Variables
RESOURCE_GROUP="vibe-slack-rg-$(date +%s)"
LOCATION="East US"
VM_NAME="vibe-slack-vm"
VM_SIZE="Standard_B2s"
ADMIN_USERNAME="azureuser"

echo "Creating resource group: $RESOURCE_GROUP"
az group create --name $RESOURCE_GROUP --location "$LOCATION"

echo "Creating VM (this will take a few minutes)..."
VM_RESULT=$(az vm create \
    --resource-group $RESOURCE_GROUP \
    --name $VM_NAME \
    --image Win2019Datacenter \
    --size $VM_SIZE \
    --admin-username $ADMIN_USERNAME \
    --generate-ssh-keys \
    --public-ip-sku Standard \
    --output json)

PUBLIC_IP=$(echo $VM_RESULT | jq -r '.publicIpAddress')

echo "Opening ports..."
az vm open-port --resource-group $RESOURCE_GROUP --name $VM_NAME --port 3000 --priority 1000
az vm open-port --resource-group $RESOURCE_GROUP --name $VM_NAME --port 3001 --priority 1001

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo "VM Name: $VM_NAME"
echo "Public IP: $PUBLIC_IP"
echo "Username: $ADMIN_USERNAME"
echo ""
echo "Next steps:"
echo "1. RDP to the VM: mstsc /v:$PUBLIC_IP"
echo "2. Run the setup-vm.ps1 script on the VM"
echo ""
echo "Your chat app will be available at: http://$PUBLIC_IP:3000"
