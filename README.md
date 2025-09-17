# Script Chunker & Image Generator

An AI-powered application that automatically divides scripts into meaningful chunks and generates images for each chunk using OpenAI's API.

## Features

- **Intelligent Script Chunking**: Uses OpenAI GPT to divide scripts into 5-10 second chunks while respecting context
- **Chunk Regeneration**: Regenerate individual chunks to improve content
- **AI Image Generation**: Generate minimalist vector illustrations for each chunk using DALL-E
- **Modern UI**: Built with React, Vite, and Joy UI for a beautiful user experience
- **MongoDB Storage**: Persistent storage for scripts and chunks

## Project Structure

```
├── backend/          # Node.js Express server
│   ├── models/       # MongoDB models
│   ├── routes/       # API routes
│   ├── services/     # OpenAI service
│   └── server.js     # Main server file
├── frontend/         # React + Vite frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API service
│   │   └── App.jsx      # Main app component
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (recommended) or local MongoDB installation
- OpenAI API key

## Setup Instructions

### 1. Clone and Setup

```bash
# Navigate to your project directory
cd /home/jawad/open-ai-image-gen

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your configuration:

**For MongoDB Atlas:**
```env
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/script-chunker?retryWrites=true&w=majority
PORT=5000
```

**For Local MongoDB:**
```env
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017/script-chunker
PORT=5000
```

### 3. Setup MongoDB

**Option A: MongoDB Atlas (Recommended - Cloud)**

Follow the detailed guide in `MONGODB_ATLAS_SETUP.md` to:
1. Create a free MongoDB Atlas account
2. Set up a cluster
3. Create database user and configure network access
4. Get your connection string

**Option B: Local MongoDB**

```bash
# For Ubuntu/Debian
sudo systemctl start mongod

# For macOS with Homebrew
brew services start mongodb-community
```

### 4. Run the Application

Start the backend server:

```bash
cd backend
npm run dev
```

In a new terminal, start the frontend:

```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage

1. **Create a Script**: Enter a title and paste your script content
2. **AI Chunking**: The system will automatically divide your script into meaningful chunks
3. **View Chunks**: See all chunks with timing information and topics
4. **Regenerate Chunks**: Click "Regenerate" to improve any chunk's content
5. **Generate Images**: Click "Generate Image" to create visual representations
6. **Customize Colors**: Specify colors for generated images (e.g., "blue", "red", "white")

## API Endpoints

- `POST /api/scripts` - Create and chunk a new script
- `GET /api/scripts` - Get all scripts
- `GET /api/scripts/:id` - Get a specific script
- `PUT /api/scripts/:scriptId/chunks/:chunkId/regenerate` - Regenerate a chunk
- `POST /api/scripts/:scriptId/chunks/:chunkId/generate-image` - Generate image for chunk
- `DELETE /api/scripts/:id` - Delete a script
- `GET /api/health` - Health check

## Technologies Used

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- OpenAI API (GPT-3.5-turbo & DALL-E 3)
- CORS & dotenv

### Frontend
- React 18
- Vite
- Joy UI (Material-UI)
- Axios

## Configuration

### OpenAI API
- **Text Model**: GPT-3.5-turbo for script chunking and regeneration
- **Image Model**: DALL-E 3 for image generation
- **Image Style**: Minimalist flat vector illustrations with transparent backgrounds

### Chunking Logic
- Target duration: 5-10 seconds per chunk
- Context-aware splitting (respects sentence boundaries and topics)
- Automatic topic extraction for image generation

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure backend server is running on port 5000
   - Check if MongoDB is running
   - Verify OpenAI API key is valid

2. **Image Generation Fails**
   - Check OpenAI API key permissions
   - Ensure sufficient API credits
   - Verify internet connection

3. **Chunking Takes Too Long**
   - Large scripts may take time to process
   - Consider breaking very long scripts into smaller parts

### Error Messages

- `Cannot connect to the backend server` - Backend not running
- `Failed to chunk script` - OpenAI API issue or invalid script
- `Failed to generate image` - DALL-E API issue or invalid prompt

## Development

### Adding New Features

1. **Backend**: Add routes in `backend/routes/scripts.js`
2. **Frontend**: Create components in `frontend/src/components/`
3. **API**: Update service in `frontend/src/services/api.js`

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Backend server port (default: 5000)

## License

MIT License - feel free to use this project for your own purposes.
