#!/bin/bash
set -e

echo "Installing frontend dependencies..."
npm install

echo "Building frontend..."
npm run build

if [ ! -d "dist" ]; then
    echo "Error: Frontend build failed - dist directory not created"
    exit 1
fi

echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo "Build completed successfully!"
