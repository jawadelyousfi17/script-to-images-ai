#!/bin/bash

# Script Chunker & Image Generator - PM2 Stopper
# This script stops both frontend and backend processes

echo "🛑 Stopping Script Chunker & Image Generator..."

# Stop all processes
pm2 stop ecosystem.config.js

# Show final status
echo ""
echo "📊 Final status:"
pm2 status

echo ""
echo "✅ All processes stopped successfully!"
echo ""
echo "💡 To completely remove processes from PM2:"
echo "   pm2 delete ecosystem.config.js"
echo ""
echo "🔄 To restart later:"
echo "   ./run.sh"
echo ""
