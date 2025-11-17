#!/bin/bash

echo "====================================="
echo "Egerton AI Platform - Cleanup Script"
echo "====================================="
echo ""
echo "This script will remove unnecessary folders and files"
echo "that are causing errors."
echo ""
read -p "Press Enter to continue..."

cd student-frontend/src

echo ""
echo "Removing gamification..."
rm -rf components/Gamification
rm -f contexts/GamificationContext.js

echo "Removing mood detection (facial recognition)..."
rm -rf components/mood-detection

echo "Removing metaverse..."
rm -rf components/Metaverse
rm -f pages/MetaversePage.js

echo "Removing payment context..."
rm -f contexts/PaymentContext.js

echo "Removing old pages..."
rm -f pages/HomePage.js
rm -f pages/Auth/RegisterPage.js
rm -f pages/JobsPage.js
rm -f pages/InstitutionPage.js

echo "Removing test utils..."
rm -f test-utils/gamification-test-utils.js

echo "Removing backup files..."
rm -f App.js.backup

cd ../..

echo ""
echo "====================================="
echo "Cleanup Complete!"
echo "====================================="
echo ""
echo "Next steps:"
echo "1. Restart your development server (Ctrl+C then npm start)"
echo "2. Refresh your browser (Ctrl+R or F5)"
echo ""
