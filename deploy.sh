#!/bin/bash

# Script Chunker & Image Generator - Production Deployment
# This script builds the frontend and deploys everything to production

echo "🚀 Starting Production Deployment..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2 globally..."
    npm install -g pm2
fi

# Stop any existing processes
echo "🛑 Stopping existing processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Install dependencies
echo "📦 Installing dependencies..."

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
    echo "   NODE_ENV=production"
    echo ""
    exit 1
fi

# Update frontend .env for production
echo "🔧 Configuring frontend for production..."
if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
fi

# Update API URL in frontend .env for production (same server, different port)
sed -i 's|VITE_API_URL=.*|VITE_API_URL=http://localhost:5000/api|g' frontend/.env
sed -i 's|VITE_NODE_ENV=.*|VITE_NODE_ENV=production|g' frontend/.env

# Build frontend for production
echo "🏗️  Building frontend for production..."
cd frontend
npm run build
cd ..

if [ ! -d "frontend/dist" ]; then
    echo "❌ Frontend build failed! dist directory not found."
    exit 1
fi

echo "✅ Frontend built successfully!"

# Update backend .env for production
echo "🔧 Setting backend to production mode..."
if ! grep -q "NODE_ENV=production" backend/.env; then
    echo "NODE_ENV=production" >> backend/.env
fi

# Create production PM2 ecosystem
echo "📋 Creating production PM2 configuration..."
cat > ecosystem.production.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'script-chunker-production',
      script: 'server.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      log_file: '../logs/production-combined.log',
      out_file: '../logs/production-out.log',
      error_file: '../logs/production-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000
    }
  ]
};
EOF

# Create logs directory
mkdir -p logs

# Start production server
echo "🚀 Starting production server..."
pm2 start ecosystem.production.js

# Show status
echo ""
echo "✅ Production deployment completed!"
echo ""
pm2 status

echo ""
echo "🌐 Access your application:"
echo "  Application: http://your-server-ip:5000"
echo "  API:         http://your-server-ip:5000/api/health"
echo ""
echo "📋 Production management commands:"
echo "  pm2 status                    - Show process status"
echo "  pm2 logs script-chunker-production - Show logs"
echo "  pm2 restart script-chunker-production - Restart app"
echo "  pm2 stop script-chunker-production - Stop app"
echo "  pm2 monit                     - Real-time monitoring"
echo ""
echo "🔄 To update the application:"
echo "  git pull                      - Pull latest changes"
echo "  ./deploy.sh                   - Redeploy"
echo ""

# Setup auto-startup (optional)
echo "💡 To enable auto-startup on server reboot:"
echo "  pm2 startup"
echo "  pm2 save"
echo ""
