# Azure Windows VM Deployment Guide for Vibe Slack

This guide will help you deploy the Vibe Slack chat application on an Azure Windows VM.

## Prerequisites

1. **Azure CLI** installed on your local machine
   - Download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
   - Login: `az login`

2. **Azure Subscription** with appropriate permissions to create VMs

## Step 1: Create Azure VM

Run the deployment script from your local machine:

```powershell
.\deploy-azure-vm.ps1
```

This script will:
- Create a resource group
- Create a Windows Server 2019 VM
- Open required ports (3000, 3001, 80, 443)
- Provide connection information

**Customization options:**
```powershell
.\deploy-azure-vm.ps1 -ResourceGroupName "my-chat-app" -Location "West US 2" -VMName "my-vm" -VMSize "Standard_B1s"
```

## Step 2: Connect to VM

1. **Get connection info** from the script output or `vm-connection-info.json`
2. **RDP to the VM:**
   ```
   mstsc /v:[PUBLIC_IP]
   ```
3. **Login** with the username and password you created

## Step 3: Setup Application on VM

1. **Download the setup script** to the VM:
   - Open PowerShell as Administrator
   - Navigate to a working directory (e.g., `C:\`)

2. **Copy the setup script** content from `setup-vm.ps1` to the VM

3. **Run the setup script:**
   ```powershell
   .\setup-vm.ps1
   ```

This will:
- Install Node.js, Git, and dependencies
- Clone your GitHub repository
- Install application dependencies
- Build the client for production
- Create initial data files
- Configure and start the application with PM2

## Step 4: Access Your Application

After deployment, your chat application will be available at:

- **Client (Chat Interface):** `http://[PUBLIC_IP]:3000`
- **Server API:** `http://[PUBLIC_IP]:3001`

## Application Management

### Check Application Status
```powershell
pm2 status
```

### View Logs
```powershell
pm2 logs vibe-slack-server
pm2 logs vibe-slack-client
```

### Restart Application
```powershell
pm2 restart all
```

### Stop Application
```powershell
pm2 stop all
```

## Security Considerations

1. **Change default passwords** after deployment
2. **Configure Windows Firewall** as needed
3. **Enable HTTPS** for production use
4. **Regular updates** of the VM and application

## Troubleshooting

### If the application doesn't start:
1. Check PM2 status: `pm2 status`
2. Check logs: `pm2 logs`
3. Restart services: `pm2 restart all`

### If you can't access the app:
1. Verify VM is running in Azure portal
2. Check Azure Network Security Group rules
3. Verify Windows Firewall settings
4. Test ports: `telnet [PUBLIC_IP] 3000`

### If you need to update the application:
1. Connect to VM via RDP
2. Navigate to `C:\vibe-slack`
3. Pull latest changes: `git pull origin master`
4. Restart: `pm2 restart all`

## Monitoring

- **Azure Portal:** Monitor VM performance and costs
- **PM2 Monitoring:** Built-in process monitoring
- **Application Logs:** Available via PM2 logs

## Scaling

For production use, consider:
- **Load Balancer** for multiple VM instances
- **Azure Application Gateway** for SSL termination
- **Azure Database** instead of JSON files
- **Azure Storage** for file uploads
- **Azure CDN** for static assets

## Cost Optimization

- Use **B-series burstable VMs** for development/testing
- **Auto-shutdown** for non-production environments
- **Reserved Instances** for production workloads
- Monitor costs in Azure Portal

## Support

If you encounter issues:
1. Check this documentation
2. Review application logs
3. Verify Azure resource configuration
4. Check GitHub repository for updates
