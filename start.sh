#!/bin/bash
echo "========================================"
echo "  PDFForge - Development Startup"
echo "========================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python not found. Install Python 3.12+"
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found. Install Node.js 22+"
    exit 1
fi

echo "[1/4] Installing backend dependencies..."
cd backend
pip install -r requirements.txt -q 2>/dev/null
cd ..

echo "[2/4] Installing frontend dependencies..."
cd frontend
npm install --silent 2>/dev/null
cd ..

echo "[3/4] Starting backend on port 8000..."
cd backend && python3 -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

echo "[4/4] Starting frontend on port 3000..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  PDFForge is running!"
echo "========================================"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  Swagger:   http://localhost:8000/docs"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
