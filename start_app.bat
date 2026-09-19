@echo off
title DocShield AI - Identity & Document Screening System
echo ========================================================
echo Starting DocShield AI Screening Platform...
echo ========================================================
cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\Programs\Python\Python311;C:\Users\Krris\tools\node-v20.18.0-win-x64;%PATH%"
python -m backend.main
pause
