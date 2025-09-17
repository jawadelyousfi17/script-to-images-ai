#!/bin/bash

# Script Chunker & Image Generator - Development Mode
# This script starts both frontend and backend in development mode with PM2

echo "🔧 Starting Script Chunker & Image Generator in DEVELOPMENT mode..."

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

# Check for .env files
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env file not found!"
    echo "📝 Please create backend/.env with your OpenAI API key:"
    echo "   OPENAI_API_KEY=your_api_key_here"
    echo "   MONGODB_URI=mongodb://localhost:27017/script-chunker"
    echo ""
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Warning: frontend/.env file not found!"
    echo "📝 Creating frontend/.env from template..."
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env with default API URL"
    echo ""
fi

# Start processes with PM2 in development mode
echo "🚀 Starting applications in DEVELOPMENT mode..."
pm2 start ecosystem.config.js --env development

# Enable watch mode for development
echo "👀 Enabling watch mode for backend..."
pm2 restart script-chunker-backend --watch

# Show status
echo ""
echo "✅ Development environment started successfully!"
echo ""
pm2 status

echo ""
echo "🔧 Development features enabled:"
echo "  ✅ Backend auto-restart on file changes"
echo "  ✅ Frontend hot module replacement"
echo "  ✅ Detailed logging"
echo ""
echo "📋 Development commands:"
echo "  pm2 logs             - Show all logs (live)"
echo "  pm2 logs backend     - Show backend logs only"
echo "  pm2 logs frontend    - Show frontend logs only"
echo "  pm2 restart backend  - Restart backend only"
echo "  pm2 restart frontend - Restart frontend only"
echo ""
echo "🌐 Access the application:"
echo "  Frontend: http://localhost:3000 (or http://your-server-ip:3000 on VPS)"
echo "  Backend:  http://localhost:5000 (or http://your-server-ip:5000 on VPS)"
echo "  Health:   http://localhost:5000/api/health"
echo ""
echo "📝 For VPS deployment:"
echo "  1. Update frontend/.env with your server IP:"
echo "     VITE_API_URL=http://your-server-ip:5000/api"
echo "  2. Make sure ports 3000 and 5000 are open in firewall"
echo ""
