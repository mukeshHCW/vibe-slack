@echo off
echo === EEG Vibe Slack - Data Recovery Utility ===
echo.

cd C:\vibe-slack\server\data

echo Checking data files for corruption...

echo Backing up current data files...
if exist users.json copy users.json users.json.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
if exist channels.json copy channels.json channels.json.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
if exist messages.json copy messages.json messages.json.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
if exist direct_messages.json copy direct_messages.json direct_messages.json.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
if exist user_read_status.json copy user_read_status.json user_read_status.json.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%

echo Recreating data files with clean structure...

echo [] > users.json
echo [{"id":"general","name":"general","description":"General discussion","createdBy":"system","createdAt":"2025-08-25T00:00:00.000Z","members":[]}] > channels.json
echo [] > messages.json
echo [] > direct_messages.json
echo [] > user_read_status.json

echo.
echo Data files have been reset to clean state.
echo Your previous data has been backed up with timestamp.
echo.
echo Restarting the server...
cd ..
pm2 restart vibe-slack-server

echo.
echo Recovery complete! Your application should now work properly.
pause
