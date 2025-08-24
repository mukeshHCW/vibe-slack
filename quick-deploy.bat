@echo off
echo === EEG Vibe Slack Quick Deployment ===
echo.

echo Setting execution policy...
powershell -Command "Set-ExecutionPolicy RemoteSigned -Force"

echo Installing Chocolatey...
powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"

echo Installing Node.js and Git...
choco install nodejs git -y

echo Creating application directory...
mkdir C:\vibe-slack
cd C:\vibe-slack

echo Cloning repository...
git clone https://github.com/mukeshHCW/vibe-slack.git .

echo Installing server dependencies...
cd server
npm install

echo Installing client dependencies and building...
cd ..\client
npm install
npm run build

echo Installing PM2 and serve...
npm install -g pm2 serve

echo Creating initial data files...
mkdir ..\server\data
echo [] > ..\server\data\users.json
echo [] > ..\server\data\channels.json
echo [] > ..\server\data\messages.json
echo [] > ..\server\data\direct_messages.json
echo [] > ..\server\data\user_read_status.json

echo Starting application...
cd ..
pm2 start server/index.js --name "vibe-slack-server"
cd client
pm2 start "serve -s build -l 3000" --name "vibe-slack-client"

echo.
echo === DEPLOYMENT COMPLETE ===
echo Your EEG Vibe Slack app is running at:
echo http://4.157.242.240:3000
echo.
pause
