#!/bin/sh

# Ensure the script exits if a command fails
set -e

echo "Starting ReachInbox.ai Full-stack App..."

# Apply Prisma database migrations/push
echo "Syncing database schema..."
cd /app/backend
npx prisma db push

# Start the Express Backend in the background
echo "Starting Backend on port 4000..."
node dist/index.js &

# Start the Next.js Frontend in the background
echo "Starting Frontend on port 3000..."
cd /app/frontend
node server.js &

# Wait for all background processes to finish
wait -n
