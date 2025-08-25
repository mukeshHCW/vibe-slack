@echo off
echo === EEG Vibe Slack Quick Deployment ===
echo.

REM Load configuration from .env.production if available
if exist .env.production (
    echo Loading configuration from .env.production...
    for /f "usebackq tokens=1,2 delims==" %%a in (".env.production") do (
        if not "%%a"=="" if not "%%a:~0,1%%"=="#" (
            set "%%a=%%b"
        )
    )
) else (
    echo Using default configuration...
    set "PROD_DOMAIN=eeg-vibe-slack.eastus.cloudapp.azure.com"
    set "PROD_VM_IP=4.157.242.240"
    set "PROD_CLIENT_PORT=3000"
    set "PROD_SERVER_PORT=5000"
)

echo Configuration:
echo Domain: %PROD_DOMAIN%
echo VM IP: %PROD_VM_IP%
echo Client Port: %PROD_CLIENT_PORT%
echo Server Port: %PROD_SERVER_PORT%
echo.

echo Setting execution policy...
powershell -Command "Set-ExecutionPolicy RemoteSigned -Force"

echo Installing Chocolatey...
powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"

echo Installing Node.js and Git...
choco install nodejs git -y

echo Refreshing environment...
refreshenv

echo Creating application directory...
mkdir C:\vibe-slack
cd C:\vibe-slack

echo Cloning repository...
git clone https://github.com/mukeshHCW/vibe-slack.git .

echo Setting up environment variables...
echo NODE_ENV=production > .env
echo PROD_DOMAIN=%PROD_DOMAIN% >> .env
echo PROD_VM_IP=%PROD_VM_IP% >> .env
echo PROD_CLIENT_PORT=%PROD_CLIENT_PORT% >> .env
echo PROD_SERVER_PORT=%PROD_SERVER_PORT% >> .env

echo Setting up client environment variables...
echo VITE_PROD_DOMAIN=%PROD_DOMAIN% > client\.env.production
echo VITE_PROD_SERVER_PORT=%PROD_SERVER_PORT% >> client\.env.production

echo Installing server dependencies...
cd server
npm install --ignore-scripts

echo Installing client dependencies and building...
cd ..\client
npm install
npm install -g typescript
npm run build

echo Installing PM2 and serve...
npm install -g pm2 serve

echo Setting up Windows Firewall rules...
netsh advfirewall firewall add rule name="Allow Port %PROD_CLIENT_PORT%" dir=in action=allow protocol=TCP localport=%PROD_CLIENT_PORT%
netsh advfirewall firewall add rule name="Allow Port %PROD_SERVER_PORT%" dir=in action=allow protocol=TCP localport=%PROD_SERVER_PORT%

echo Creating initial data files...
mkdir ..\server\data
echo [] > ..\server\data\users.json
echo [{"id":"general","name":"general","description":"General discussion","createdBy":"system","createdAt":"2025-08-25T00:00:00.000Z","members":[]}] > ..\server\data\channels.json
echo [] > ..\server\data\messages.json
echo [] > ..\server\data\direct_messages.json
echo [] > ..\server\data\user_read_status.json

echo Downloading data recovery utility...
curl -L -o ..\fix-data-corruption.bat https://raw.githubusercontent.com/mukeshHCW/vibe-slack/master/fix-data-corruption.bat

echo Starting application...
cd ..\server
pm2 start index.js --name "vibe-slack-server"
cd ..\client
pm2 start "npx serve -s dist -p %PROD_CLIENT_PORT%" --name "vibe-slack-client"

echo.
echo === DEPLOYMENT COMPLETE ===
echo Your EEG Vibe Slack app is running at:
echo http://%PROD_DOMAIN%:%PROD_CLIENT_PORT%
echo http://%PROD_VM_IP%:%PROD_CLIENT_PORT%
echo.
echo Server running on:
echo http://%PROD_DOMAIN%:%PROD_SERVER_PORT%
echo http://%PROD_VM_IP%:%PROD_SERVER_PORT%
echo.
pause
