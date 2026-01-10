#!/bin/bash
# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Set default ports if not specified
export PORT=${PORT:-6000}
export CLIENT_PORT=${CLIENT_PORT:-3000}

echo "Starting Las Nubes..."
echo "Backend: http://localhost:${PORT}"
echo "Frontend: http://localhost:${CLIENT_PORT}"
echo ""

# Start backend
node server.js &
BACKEND_PID=$!

# Start frontend
cd client
PORT=$CLIENT_PORT npm start &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
