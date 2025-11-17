@echo off
echo =====================================
echo Egerton AI Platform - Cleanup Script
echo =====================================
echo.
echo This script will remove unnecessary folders and files
echo that are causing errors.
echo.
pause

cd student-frontend\src

echo.
echo Removing gamification...
if exist "components\Gamification" rmdir /s /q "components\Gamification"
if exist "contexts\GamificationContext.js" del /q "contexts\GamificationContext.js"

echo Removing mood detection (facial recognition)...
if exist "components\mood-detection" rmdir /s /q "components\mood-detection"

echo Removing metaverse...
if exist "components\Metaverse" rmdir /s /q "components\Metaverse"
if exist "pages\MetaversePage.js" del /q "pages\MetaversePage.js"

echo Removing payment context...
if exist "contexts\PaymentContext.js" del /q "contexts\PaymentContext.js"

echo Removing old pages...
if exist "pages\HomePage.js" del /q "pages\HomePage.js"
if exist "pages\Auth\RegisterPage.js" del /q "pages\Auth\RegisterPage.js"
if exist "pages\JobsPage.js" del /q "pages\JobsPage.js"
if exist "pages\InstitutionPage.js" del /q "pages\InstitutionPage.js"

echo Removing test utils...
if exist "test-utils\gamification-test-utils.js" del /q "test-utils\gamification-test-utils.js"

echo Removing backup files...
if exist "App.js.backup" del /q "App.js.backup"

cd ..\..

echo.
echo =====================================
echo Cleanup Complete!
echo =====================================
echo.
echo Next steps:
echo 1. Close this window
echo 2. Restart your development server
echo 3. Refresh your browser
echo.
pause
