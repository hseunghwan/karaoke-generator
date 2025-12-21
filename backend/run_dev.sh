#!/bin/bash

# Function to kill all background processes on exit
cleanup() {
    echo "Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    wait
    echo "All services stopped."
}

# Trap SIGINT (Ctrl+C) to run cleanup
trap cleanup SIGINT

# Check if Redis is running, if not start it
if ! pgrep -x "redis-server" > /dev/null; then
    echo "Starting Redis..."
    redis-server &
else
    echo "Redis is already running."
fi

# Activate virtual environment
source venv/bin/activate

# Start Celery Worker
echo "Starting Celery Worker..."
celery -A app.worker.celery_app worker --loglevel=info -Q main-queue,celery &

# Start API Server
echo "Starting API Server..."
uvicorn app.main:app --reload --port 8000 &

# Wait for all background processes
wait
