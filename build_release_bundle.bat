@echo off
title SSSAM Academy - Build Play Store Release Bundle (.aab)
echo ========================================================
echo   SSSAM ACADEMY - GOOGLE PLAY RELEASE BUNDLE BUILDER
echo ========================================================
echo.

cd /d "%~dp0android"

echo [1/2] Cleaning previous builds...
call gradlew.bat clean

echo [2/2] Building Android App Bundle (Release .aab)...
call gradlew.bat bundleRelease

if exist "app\build\outputs\bundle\release\app-release.aab" (
    echo.
    echo ========================================================
    echo   BUILD SUCCESSFUL!
    echo   Your Release Bundle (.aab) is ready at:
    echo   android\app\build\outputs\bundle\release\app-release.aab
    echo ========================================================
    explorer /select,"app\build\outputs\bundle\release\app-release.aab"
) else (
    echo.
    echo --------------------------------------------------------
    echo Note: If release signing is not configured yet, 
    echo you can also build debug/universal bundle with:
    echo call gradlew.bat bundleDebug
    echo --------------------------------------------------------
)

pause
