@echo off
setlocal enabledelayedexpansion

:: Configuration
set SERVER=timesglobal@111.119.60.23
set REMOTE_PATH=/home/timesglobal/logbook
set LOCAL_DIR=C:\Users\manik\Desktop\loogbook-new
set TEMP_DIR=%TEMP%\logbook_deploy

echo ========================================
echo Transferring code to server...
echo Server: %SERVER%
echo Remote path: %REMOTE_PATH%
echo Local directory: %LOCAL_DIR%
echo ========================================
echo.

:: Check if directory exists
if not exist "%LOCAL_DIR%" (
    echo Error: Local directory not found!
    pause
    exit /b 1
)

:: Clean and create temp directory
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

:: Define exclusions (case-insensitive match)
set EXCLUDE_LIST=node_modules .git dist build .env .vscode .idea coverage cobertura

echo Copying essential files to temp directory...
echo Excluding: %EXCLUDE_LIST%
echo.

:: Copy files excluding specified patterns
set FILES_TO_COPY=
for /d %%d in ("%LOCAL_DIR%\*") do (
    set "skip="
    for %%e in (%EXCLUDE_LIST%) do (
        if /i "%%~nxd"=="%%e" set "skip=1"
    )
    if not defined skip (
        xcopy "%%d" "%TEMP_DIR%\%%~nxd\" /e /i /h /y >nul 2>&1
    )
)

:: Also copy files directly in root (not in subdirectories)
for %%f in ("%LOCAL_DIR%\*") do (
    if not exist "%%f\*" (
        set "skip="
        for %%e in (%EXCLUDE_LIST%) do (
            if /i "%%~nxf"=="%%e" set "skip=1"
        )
        if not defined skip (
            copy "%%f" "%TEMP_DIR%\" >nul 2>&1
        )
    )
)

:: Check if we have files to transfer
if not exist "%TEMP_DIR%\*" (
    echo Error: No files to transfer! All files excluded?
    pause
    exit /b 1
)

echo.
echo Transferring files to server...
scp -P 15153 -r "%TEMP_DIR%\*" "%SERVER%:%REMOTE_PATH%\" 2>nul

if errorlevel 1 (
    echo.
    echo Transfer failed! Make sure:
    echo 1. SSH access to %SERVER% is configured
    echo 2. You have permission to write to %REMOTE_PATH%
    echo 3. SCP/SSH is installed on your system
    echo 4. The remote path exists: %REMOTE_PATH%
    pause
    rmdir /s /q "%TEMP_DIR%" 2>nul
    exit /b 1
)

:: Clean up
rmdir /s /q "%TEMP_DIR%" 2>nul

echo.
echo ========================================
echo Transfer complete!
echo Files transferred to: %SERVER%:%REMOTE_PATH%
echo.
echo Next steps on the server:
echo   cd %REMOTE_PATH%
echo   npm install
echo.
echo Or from here (if SSH keys set up):
echo   ssh %SERVER% "cd %REMOTE_PATH% && npm install"
echo ========================================
pause
