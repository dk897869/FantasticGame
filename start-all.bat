@echo off
echo ========================================================
echo       Starting FantasticGame MERN Platform
echo ========================================================

echo Starting Backend API on http://localhost:5000 ...
start "FantasticGame Backend" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend on http://localhost:5173 ...
start "FantasticGame Frontend" cmd /k "cd frontend && npm run dev"

echo ========================================================
echo Platform is launching!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:5000/api
echo ========================================================
pause
