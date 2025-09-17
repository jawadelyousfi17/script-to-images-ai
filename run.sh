#!/bin/bash

# Script Chunker & Image Generator - PM2 Runner
# This script starts both frontend and backend using PM2

echo "🚀 Starting Script Chunker & Image Generator with PM2..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2 globally..."
    npm install -g pm2
fi

# Stop any existing processes
echo "🛑 Stopping existing processes..."
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 delete ecosystem.config.js 2>/dev/null || true

# Install dependencies if needed
echo "📦 Checking dependencies..."

# Backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Check for .env file
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env file not found!"
    echo "📝 Please create backend/.env with your OpenAI API key:"
    echo "   OPENAI_API_KEY=your_api_key_here"
    echo "   MONGODB_URI=mongodb://localhost:27017/script-chunker"
    echo ""
fi

# Start processes with PM2
echo "🚀 Starting applications with PM2..."
pm2 start ecosystem.config.js

# Show status
echo ""
echo "✅ Applications started successfully!"
echo ""
pm2 status

echo ""
echo "📋 Useful PM2 commands:"
echo "  pm2 status           - Show process status"
echo "  pm2 logs             - Show all logs"
echo "  pm2 logs backend     - Show backend logs only"
echo "  pm2 logs frontend    - Show frontend logs only"
echo "  pm2 restart all      - Restart all processes"
echo "  pm2 stop all         - Stop all processes"
echo "  pm2 delete all       - Delete all processes"
echo ""
echo "🌐 Access the application:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo "  Health:   http://localhost:5000/api/health"
echo ""
echo "📊 Monitor with PM2:"
echo "  pm2 monit           - Real-time monitoring dashboard"
echo ""
