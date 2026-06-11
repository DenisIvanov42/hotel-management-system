#!/bin/bash

echo "🚀 Starting servers..."

# Start backend and send all text to backend.log
cd backend
./gradlew bootRun > ../backend.log 2>&1 &
BACKEND_PID=$!

# Start frontend and send all text to frontend.log
cd ../frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!

cd ..
clear # Clears the terminal screen!

echo "========================================================"
echo "✅ Servers are running silently in the background!"
echo ""
echo "➡️  Frontend UI:  http://localhost:5173"
echo "➡️  Backend API:  http://localhost:8080"
echo ""
echo "📝 To see the live logs, open a new terminal and run:"
echo "    tail -f frontend.log    (for React)"
echo "    tail -f backend.log     (for Spring Boot)"
echo ""
echo "🛑 KEEP THIS OPEN. Press [CTRL + C] to stop both servers."
echo "========================================================"

trap "echo -e '\n🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT

wait $BACKEND_PID $FRONTEND_PID