@echo off
echo Triggering install on your Xiaomi phone...
echo Please look at your phone screen and tap INSTALL when prompted!
echo.
set ADB="D:\platform-tools\adb.exe"

for /L %%i in (1,1,5) do (
    echo [Attempt %%i/5] Installing...
    %ADB% install -r "D:\Software\SSSAM CRM\SSSAM-Portal.apk"
    if !errorlevel! equ 0 (
        echo.
        echo ===================================
        echo   SSSAM Portal Installed Successfully!
        echo ===================================
        %ADB% shell monkey -p com.sssam.academy -c android.intent.category.LAUNCHER 1
        exit /b 0
    )
    timeout /t 2 /nobreak >nul
)
