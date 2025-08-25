const config = require('../config.js');

/**
 * Setup Azure Network Security Group rules
 * This script creates the necessary firewall rules for the application
 */

async function setupAzureNSG() {
  const azureConfig = config.azure;
  const ports = config.ports;
  
  console.log('Setting up Azure Network Security Group rules...');
  console.log(`Resource Group: ${azureConfig.resourceGroup}`);
  console.log(`NSG Name: ${azureConfig.nsgName}`);
  console.log(`Client Port: ${ports.client}`);
  console.log(`Server Port: ${ports.server}`);
  
  // Note: This would require Azure CLI to be installed and authenticated
  // For now, we'll output the commands that need to be run
  
  const commands = [
    `az network nsg rule create --resource-group ${azureConfig.resourceGroup} --nsg-name ${azureConfig.nsgName} --name allow-http-${ports.client} --protocol tcp --priority 1100 --destination-port-range ${ports.client} --access allow --direction Inbound --source-address-prefix "*"`,
    `az network nsg rule create --resource-group ${azureConfig.resourceGroup} --nsg-name ${azureConfig.nsgName} --name allow-http-${ports.server} --protocol tcp --priority 1300 --destination-port-range ${ports.server} --access allow --direction Inbound --source-address-prefix "*"`
  ];
  
  console.log('\nRun these commands to setup Azure NSG rules:');
  commands.forEach((cmd, index) => {
    console.log(`${index + 1}. ${cmd}`);
  });
  
  return commands;
}

if (require.main === module) {
  setupAzureNSG();
}

module.exports = { setupAzureNSG };
