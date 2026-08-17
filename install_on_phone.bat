@echo off
setlocal enabledelayedexpansion
title SSSAM Portal - Android App Installer

echo ===================================================
echo     SSSAM Portal - Android App 1-Click Installer 📱
echo ===================================================
echo.

:: 1. Check for ADB in PATH or D:\platform-tools\adb.exe
set ADB_CMD=adb
if exist "D:\platform-tools\adb.exe" (
    set ADB_CMD="D:\platform-tools\adb.exe"
)

:: Test if adb is accessible
%ADB_CMD% version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] ADB not found. Please install Android Platform Tools.
    pause
    exit /b 1
)

echo [1/3] Checking connected Android devices...
echo ---------------------------------------------------
%ADB_CMD% devices
echo ---------------------------------------------------
echo.

:: 2. Check if a device is connected
for /f "skip=1 tokens=1,2" %%i in ('%ADB_CMD% devices') do (
    if "%%j"=="device" (
        set DEVICE_FOUND=1
        set DEVICE_ID=%%i
    )
)

if not defined DEVICE_FOUND (
    echo [!] NO CONNECTED PHONE DETECTED.
    echo.
    echo Please follow these 3 quick steps on your phone:
    echo  1. Connect phone to PC using USB cable.
    echo  2. Open Phone Settings -> Developer Options -> Enable 'USB Debugging'.
    echo  3. Look at your phone screen and tap 'ALLOW' / 'OK' on the popup.
    echo.
    echo Once connected, press any key to try again...
    pause >nul
    cls
    goto :check_again
)

:proceed_install
echo [2/3] Phone Detected: %DEVICE_ID%
echo.

set APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk
if not exist "%APK_PATH%" (
    echo [!] APK not built yet. Building APK now...
    cd android
    call gradlew.bat assembleDebug
    cd ..
)

if not exist "%APK_PATH%" (
    echo [ERROR] APK build failed. Please check build logs.
    pause
    exit /b 1
)

echo [3/3] Installing SSSAM Portal App onto phone...
%ADB_CMD% install -r "%APK_PATH%"

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo   SUCCESS! SSSAM Portal App Installed on Phone! 🚀
    echo ===================================================
    echo.
    echo Launching App on your phone now...
    %ADB_CMD% shell monkey -p com.sssam.academy -c android.intent.category.LAUNCHER 1 >nul 2>&1
    echo.
    echo Done! Check your phone screen.
) else (
    echo.
    echo [!] Installation failed. Please unlock your phone screen and allow installation if prompted.
)

echo.
pause
exit /b 0

:check_again
for /f "skip=1 tokens=1,2" %%i in ('%ADB_CMD% devices') do (
    if "%%j"=="device" (
        set DEVICE_FOUND=1
        set DEVICE_ID=%%i
    )
)
if defined DEVICE_FOUND (
    goto :proceed_install
) else (
    echo Still no device found. Please connect your phone and press any key...
    pause >nul
    goto :check_again
)
