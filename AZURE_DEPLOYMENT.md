# Vibe Slack - Azure Deployment Guide

## Prerequisites
- Azure CLI installed
- Node.js 18+ and npm
- Git

## Deployment Options

### Option 1: Azure App Service (Recommended for simplicity)

#### 1. Prepare the application
```bash
# Build the client
cd client
npm run build

# Copy built files to server's public directory
mkdir -p ../server/public
cp -r dist/* ../server/public/
```

#### 2. Deploy to Azure App Service
```bash
# Login to Azure
az login

# Create resource group
az group create --name vibe-slack-rg --location eastus

# Create App Service plan
az appservice plan create --name vibe-slack-plan --resource-group vibe-slack-rg --sku B1 --is-linux

# Create web app
az webapp create --resource-group vibe-slack-rg --plan vibe-slack-plan --name your-unique-app-name --runtime "NODE|18-lts"

# Configure environment variables
az webapp config appsettings set --resource-group vibe-slack-rg --name your-unique-app-name --settings \
  NODE_ENV=production \
  JWT_SECRET="your-secure-jwt-secret-here" \
  CORS_ORIGINS="https://your-unique-app-name.azurewebsites.net"

# Deploy from local git
az webapp deployment source config-local-git --name your-unique-app-name --resource-group vibe-slack-rg

# Get deployment URL
az webapp deployment list-publishing-credentials --name your-unique-app-name --resource-group vibe-slack-rg --query publishingUserName --output tsv

# Add Azure remote and deploy
git remote add azure https://your-deployment-username@your-unique-app-name.scm.azurewebsites.net/your-unique-app-name.git
git add .
git commit -m "Deploy to Azure"
git push azure main
```

### Option 2: Azure Container Instances

#### 1. Create Dockerfile (see Dockerfile in server directory)

#### 2. Build and deploy container
```bash
# Create container registry
az acr create --resource-group vibe-slack-rg --name vibeslackregistry --sku Basic

# Build and push container
az acr build --registry vibeslackregistry --image vibe-slack:latest .

# Deploy container
az container create \
  --resource-group vibe-slack-rg \
  --name vibe-slack-container \
  --image vibeslackregistry.azurecr.io/vibe-slack:latest \
  --dns-name-label your-unique-dns-name \
  --ports 80 \
  --environment-variables NODE_ENV=production \
  --secure-environment-variables JWT_SECRET="your-secure-jwt-secret"
```

### Option 3: Azure Virtual Machine

#### 1. Create VM
```bash
# Create VM
az vm create \
  --resource-group vibe-slack-rg \
  --name vibe-slack-vm \
  --image UbuntuLTS \
  --admin-username azureuser \
  --generate-ssh-keys \
  --size Standard_B2s

# Open ports
az vm open-port --port 80 --resource-group vibe-slack-rg --name vibe-slack-vm
az vm open-port --port 443 --resource-group vibe-slack-rg --name vibe-slack-vm
az vm open-port --port 5000 --resource-group vibe-slack-rg --name vibe-slack-vm
```

#### 2. Setup on VM
```bash
# SSH to VM
ssh azureuser@your-vm-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone your repository
git clone https://github.com/your-username/vibe-slack.git
cd vibe-slack

# Install dependencies and build
cd client && npm install && npm run build
cd ../server && npm install

# Setup environment variables
echo "NODE_ENV=production" > .env
echo "JWT_SECRET=your-secure-jwt-secret" >> .env
echo "PORT=5000" >> .env

# Start with PM2
pm2 start index.production.js --name vibe-slack
pm2 startup
pm2 save

# Setup Nginx reverse proxy (optional)
sudo apt install nginx
# Configure nginx to proxy to localhost:5000
```

## Environment Variables

Set these environment variables in your Azure deployment:

- `NODE_ENV=production`
- `JWT_SECRET=your-very-secure-random-string`
- `PORT=80` (for App Service, auto-configured)
- `CORS_ORIGINS=https://your-app-name.azurewebsites.net`

## Post-Deployment

1. Test your application at your Azure URL
2. Configure custom domain (optional)
3. Setup SSL certificate (Azure provides free SSL for *.azurewebsites.net)
4. Monitor with Azure Application Insights
5. Setup backup for your data files (consider migrating to Azure Database)

## Scaling Considerations

For production use, consider:
- Migrating from JSON files to Azure Database for PostgreSQL
- Using Azure Storage for file uploads
- Implementing Redis for session management
- Setting up Azure CDN for static assets
- Using Azure Load Balancer for multiple instances
