@echo off
title Agent Imprimante POS
cd /d "%~dp0"
echo Demarrage de l'agent imprimante...
node index.js --printer "POS58"
pause
