# PM2 Process Management Setup

This project includes PM2 configuration for running both frontend and backend processes in production and development environments.

## 🚀 Quick Start

### Production Mode
```bash
./run.sh
```

### Development Mode
```bash
./dev.sh
```

### Stop All Processes
```bash
./stop.sh
```

## 📋 Manual PM2 Commands

### Start Applications
```bash
pm2 start ecosystem.config.js                    # Production mode
pm2 start ecosystem.config.js --env development  # Development mode
```

### Process Management
```bash
pm2 status                    # Show all processes
pm2 restart all              # Restart all processes
pm2 restart backend          # Restart backend only
pm2 restart frontend         # Restart frontend only
pm2 stop all                 # Stop all processes
pm2 delete all               # Remove all processes
```

### Monitoring & Logs
```bash
pm2 logs                     # Show all logs (live)
pm2 logs backend             # Backend logs only
pm2 logs frontend            # Frontend logs only
pm2 monit                    # Real-time monitoring dashboard
pm2 show backend             # Detailed process info
```

### Advanced Commands
```bash
pm2 reload all               # Zero-downtime reload
pm2 restart backend --watch  # Enable file watching
pm2 save                     # Save current process list
pm2 resurrect                # Restore saved processes
pm2 startup                  # Generate startup script
```

## 🔧 Configuration

### Process Configuration (`ecosystem.config.js`)

**Backend Process:**
- **Name:** `script-chunker-backend`
- **Port:** 5000
- **Memory Limit:** 1GB
- **Auto-restart:** Yes
- **Max Restarts:** 10

**Frontend Process:**
- **Name:** `script-chunker-frontend`
- **Port:** 3000
- **Memory Limit:** 500MB
- **Auto-restart:** Yes
- **Max Restarts:** 10

### Log Files
```
logs/
├── backend-combined.log     # Backend stdout + stderr
├── backend-out.log          # Backend stdout only
├── backend-error.log        # Backend stderr only
├── frontend-combined.log    # Frontend stdout + stderr
├── frontend-out.log         # Frontend stdout only
└── frontend-error.log       # Frontend stderr only
```

## 🌐 Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

## 📊 Monitoring

### Real-time Monitoring
```bash
pm2 monit
```

### Web Dashboard (Optional)
```bash
pm2 install pm2-server-monit
# Access: http://localhost:9615
```

### Process Information
```bash
pm2 show backend    # Detailed backend info
pm2 show frontend   # Detailed frontend info
```

## 🔄 Auto-startup on System Boot

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save

# Now PM2 will auto-start on system reboot
```

## 🐛 Troubleshooting

### Check Process Status
```bash
pm2 status
```

### View Recent Logs
```bash
pm2 logs --lines 50
```

### Restart Problematic Process
```bash
pm2 restart backend
pm2 restart frontend
```

### Clear Logs
```bash
pm2 flush
```

### Reset Process
```bash
pm2 delete backend
pm2 start ecosystem.config.js
```

## 📁 File Structure

```
project-root/
├── run.sh                   # Production startup script
├── dev.sh                   # Development startup script
├── stop.sh                  # Stop all processes script
├── ecosystem.config.js      # PM2 configuration
├── PM2_SETUP.md            # This documentation
├── backend/
│   ├── server.js           # Backend entry point
│   └── package.json
├── frontend/
│   ├── package.json
│   └── vite.config.js
└── logs/                   # PM2 log files
```

## 🔒 Environment Variables

Make sure to create `backend/.env` with:
```env
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017/script-chunker
NODE_ENV=production
```

## 💡 Tips

1. **Use `pm2 monit`** for real-time monitoring
2. **Check logs regularly** with `pm2 logs`
3. **Save process list** with `pm2 save` after changes
4. **Use development mode** for active development
5. **Monitor memory usage** to prevent crashes
