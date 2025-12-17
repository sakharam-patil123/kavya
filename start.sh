#!/usr/bin/env bash
set -euo pipefail

# Root start script for Railpack / simple deployments
# - Build frontend
# - Start backend
# Adjust or extend as needed for environment variables and production setup

echo "➡ Building frontend..."
cd frontend
if [ -f package-lock.json ] || [ -f yarn.lock ]; then
  npm ci
else
  npm install
fi
npm run build

echo "➡ Starting backend..."
cd ../backend
if [ -f package-lock.json ] || [ -f yarn.lock ]; then
  npm ci
else
  npm install
fi

# Use npm start (backend has "start": "node server.js")
npm start
