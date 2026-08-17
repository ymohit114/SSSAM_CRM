@echo off
set ADB="D:\platform-tools\adb.exe"

:loop
for /f "skip=1 tokens=1,2" %%i in ('%ADB% devices') do (
    if "%%j"=="device" (
        echo Device authorized: %%i!
        echo Installing SSSAM Portal APK onto phone...
        %ADB% install -r "D:\Software\SSSAM CRM\SSSAM-Portal.apk"
        echo Launching SSSAM Portal on your phone...
        %ADB% shell monkey -p com.sssam.academy -c android.intent.category.LAUNCHER 1
        echo SUCCESS!
        exit /b 0
    )
)

echo Waiting for phone authorization (please tap 'Allow' on your phone screen)...
%ADB% devices
timeout /t 2 /nobreak >nul
goto loop
