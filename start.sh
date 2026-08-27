#!/bin/sh

# Ensure the script exits if a command fails
set -e

echo "Starting ReachInbox.ai Full-stack App..."

# Apply Prisma database migrations/push
echo "Syncing database schema..."
cd /app/backend
npx prisma db push

# Start the Express Backend explicitly on port 4000
echo "Starting Backend on port 4000..."
PORT=4000 node dist/index.js &

# Start the Next.js Frontend on assigned PORT (default 3000)
echo "Starting Frontend..."
cd /app/frontend
PORT=${PORT:-3000} node server.js &

# Keep container running and wait for background processes
wait
