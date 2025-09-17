# VPS Deployment Guide

This guide will help you deploy the Script Chunker & Image Generator to a VPS server.

## 🚀 Quick Deployment

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd script-chunker-image-generator
```

### 2. Run Production Deployment
```bash
./deploy.sh
```

### 3. Access Application
- **Application**: `http://your-server-ip:5000`
- **API Health**: `http://your-server-ip:5000/api/health`

## 📋 Detailed Setup

### Prerequisites
- Node.js 18+ installed
- MongoDB running (local or cloud)
- PM2 installed globally
- OpenAI API key

### Step-by-Step Deployment

1. **Server Setup**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 globally
   sudo npm install -g pm2
   
   # Install MongoDB (if needed)
   sudo apt install mongodb -y
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   ```

2. **Clone and Configure**:
   ```bash
   git clone <your-repo-url>
   cd script-chunker-image-generator
   
   # Create backend environment
   cp backend/.env.example backend/.env
   nano backend/.env  # Add your OpenAI API key
   ```

3. **Deploy**:
   ```bash
   ./deploy.sh
   ```

## 🔧 Configuration

### Backend Environment (`backend/.env`)
```env
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017/script-chunker
NODE_ENV=production
PORT=5000
```

### Frontend Environment (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_NODE_ENV=production
VITE_DEBUG=false
```

## 🌐 Architecture

### Production Setup
```
┌─────────────────────────────────────┐
│ VPS Server (your-server-ip:5000)    │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Node.js Backend Server          │ │
│ │ - API Routes (/api/*)           │ │
│ │ - Static Files (frontend/dist)  │ │
│ │ - Image Uploads                 │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ MongoDB Database                │ │
│ │ - Scripts & Chunks              │ │
│ │ - Batch Jobs                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### How It Works
1. **Single Port**: Everything runs on port 5000
2. **Static Serving**: Backend serves built frontend files
3. **API Routes**: `/api/*` routes handled by Express
4. **Frontend Routes**: All other routes serve `index.html`

## 🔒 Security Setup

### 1. Firewall Configuration
```bash
# Allow SSH, HTTP, and your app port
sudo ufw allow ssh
sudo ufw allow 5000
sudo ufw enable
```

### 2. Reverse Proxy (Optional - Recommended)
Set up Nginx as reverse proxy:

```bash
# Install Nginx
sudo apt install nginx -y

# Create site configuration
sudo nano /etc/nginx/sites-available/script-chunker
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/script-chunker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. SSL Certificate (Optional)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 📊 Monitoring & Management

### PM2 Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs script-chunker-production

# Restart application
pm2 restart script-chunker-production

# Stop application
pm2 stop script-chunker-production

# Real-time monitoring
pm2 monit

# Save PM2 configuration
pm2 save

# Setup auto-startup
pm2 startup
```

### Log Files
```
logs/
├── production-combined.log  # All logs
├── production-out.log       # Standard output
└── production-error.log     # Error logs
```

## 🔄 Updates & Maintenance

### Update Application
```bash
# Pull latest changes
git pull

# Redeploy
./deploy.sh
```

### Database Backup
```bash
# Backup MongoDB
mongodump --db script-chunker --out backup/$(date +%Y%m%d)

# Restore MongoDB
mongorestore --db script-chunker backup/20231201/script-chunker/
```

## 🐛 Troubleshooting

### Common Issues

**1. Port 3000 shows "Endpoint not found"**
- Solution: Use port 5000 instead
- The app serves everything from one port in production

**2. Frontend not loading**
- Check if `frontend/dist` exists
- Run `./deploy.sh` to rebuild frontend
- Verify `NODE_ENV=production` in backend/.env

**3. API errors**
- Check OpenAI API key in backend/.env
- Verify MongoDB is running: `sudo systemctl status mongodb`
- Check logs: `pm2 logs script-chunker-production`

**4. Images not generating**
- Verify OpenAI API key and billing
- Check uploads directory permissions
- Monitor logs for OpenAI API errors

### Debug Commands
```bash
# Check if app is running
pm2 status

# Check logs
pm2 logs script-chunker-production --lines 50

# Check MongoDB
sudo systemctl status mongodb

# Check disk space
df -h

# Check memory usage
free -h

# Check port usage
sudo netstat -tlnp | grep :5000
```

## 📈 Performance Optimization

### 1. Enable Gzip (Nginx)
Add to Nginx config:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. PM2 Cluster Mode
For high traffic, use cluster mode:
```javascript
// In ecosystem.production.js
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

### 3. MongoDB Optimization
```bash
# Enable MongoDB authentication
sudo nano /etc/mongod.conf
# Add: security.authorization: enabled
```

## 🎯 Success Checklist

- [ ] Application accessible at `http://your-server-ip:5000`
- [ ] API health check returns OK
- [ ] Can create and chunk scripts
- [ ] Can generate images
- [ ] Logs are being written
- [ ] PM2 shows app as online
- [ ] MongoDB is running and accessible

Your application should now be successfully deployed and accessible from your VPS!
