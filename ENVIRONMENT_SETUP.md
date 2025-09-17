# Environment Configuration

This project uses environment variables to configure both frontend and backend settings.

## 🔧 Backend Environment (.env)

Create `backend/.env` file with the following variables:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/script-chunker

# Server Configuration
PORT=5000
NODE_ENV=production

# Optional: Logging Level
LOG_LEVEL=info
```

### Required Variables:
- **OPENAI_API_KEY**: Your OpenAI API key for GPT and DALL-E access
- **MONGODB_URI**: MongoDB connection string

### Optional Variables:
- **PORT**: Backend server port (default: 5000)
- **NODE_ENV**: Environment mode (development/production)
- **LOG_LEVEL**: Logging verbosity (debug/info/warn/error)

## 🎨 Frontend Environment (.env)

Create `frontend/.env` file with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Development Settings
VITE_NODE_ENV=development

# Optional: Debug Mode
VITE_DEBUG=false
```

### Variables:
- **VITE_API_URL**: Backend API base URL
- **VITE_NODE_ENV**: Frontend environment mode
- **VITE_DEBUG**: Enable debug logging in browser console

## 🚀 Quick Setup

### Automatic Setup (Recommended)
Run the setup scripts which will create .env files automatically:

```bash
# Production mode
./run.sh

# Development mode
./dev.sh
```

### Manual Setup

1. **Backend Environment**:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your OpenAI API key
   ```

2. **Frontend Environment**:
   ```bash
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env if you need custom API URL
   ```

## 🌐 Different Environments

### Development
```env
# Backend
NODE_ENV=development
PORT=5000

# Frontend
VITE_API_URL=http://localhost:5000/api
VITE_NODE_ENV=development
VITE_DEBUG=true
```

### Production
```env
# Backend
NODE_ENV=production
PORT=5000

# Frontend
VITE_API_URL=https://your-domain.com/api
VITE_NODE_ENV=production
VITE_DEBUG=false
```

### Docker/Remote Server
```env
# Backend
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongo-container:27017/script-chunker

# Frontend
VITE_API_URL=http://your-server-ip:5000/api
```

## 🔒 Security Notes

1. **Never commit .env files** to version control
2. **Keep API keys secure** and rotate them regularly
3. **Use different keys** for development and production
4. **Restrict API key permissions** in OpenAI dashboard

## 🐛 Troubleshooting

### Common Issues:

**Frontend can't connect to backend:**
- Check `VITE_API_URL` in `frontend/.env`
- Ensure backend is running on correct port
- Verify CORS settings

**OpenAI API errors:**
- Verify `OPENAI_API_KEY` in `backend/.env`
- Check API key permissions and billing
- Ensure key format is correct (starts with `sk-`)

**Database connection issues:**
- Check `MONGODB_URI` format
- Ensure MongoDB is running
- Verify database permissions

### Environment Variable Loading:

**Backend** (Node.js):
- Uses `dotenv` package
- Loads from `backend/.env`
- Access via `process.env.VARIABLE_NAME`

**Frontend** (Vite):
- Uses Vite's built-in env loading
- Loads from `frontend/.env`
- Variables must start with `VITE_`
- Access via `import.meta.env.VITE_VARIABLE_NAME`

## 📝 Example Files

The project includes example files:
- `backend/.env.example` - Backend environment template
- `frontend/.env.example` - Frontend environment template

Copy these files and customize them for your setup.
