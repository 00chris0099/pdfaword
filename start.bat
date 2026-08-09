@echo off
echo ========================================
echo   PDFForge - Development Startup
echo ========================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python 3.12+
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install Node.js 22+
    exit /b 1
)

echo [1/4] Installing backend dependencies...
cd backend
pip install -r requirements.txt -q
cd ..

echo [2/4] Installing frontend dependencies...
cd frontend
call npm install --silent
cd ..

echo [3/4] Starting backend on port 8000...
start "PDFForge Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"

echo [4/4] Starting frontend on port 3000...
start "PDFForge Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   PDFForge is starting!
echo ========================================
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000
echo   Swagger:   http://localhost:8000/docs
echo ========================================
echo.
pause
