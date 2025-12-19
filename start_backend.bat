@echo off
REM Backend Startup Script for Windows CMD
REM Run this from the project root directory

echo === Starting AI Task Automation Backend ===

REM Check if virtual environment exists
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

REM Activate virtual environment
echo Activating virtual environment...
call .venv\Scripts\activate.bat

REM Check if requirements are installed
echo Checking dependencies...
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    pip install --upgrade pip
    pip install -r requirements.txt
)

REM Start the server
echo.
echo Starting FastAPI server on http://localhost:8000
echo API docs available at: http://localhost:8000/docs
echo Press Ctrl+C to stop the server
echo.

uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000

