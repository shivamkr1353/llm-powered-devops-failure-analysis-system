@echo off
:: Change directory to the folder where this batch file is located
cd /d "%~dp0"

echo ====================================================================
echo   Starting AI-Powered DevOps Failure Analysis Platform...
echo ====================================================================

:: Start backend in a new command window
echo Launching Backend (FastAPI on Port 8000)...
start "DevOps Failure Analysis - Backend" cmd /k "cd backend && ..\.venv\Scripts\python -m uvicorn main:app --reload --port 8000"

:: Start frontend in a new command window
echo Launching Frontend (React/Vite on Port 5173)...
start "DevOps Failure Analysis - Frontend" cmd /k "cd frontend && npm run dev"

:: Wait for servers to initialize
echo Waiting for servers to initialize...
ping 127.0.0.1 -n 6 > NUL

:: Open the browser
echo Opening the web application...
start http://localhost:5173/

echo Platform started successfully!
