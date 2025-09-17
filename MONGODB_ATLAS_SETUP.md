# MongoDB Atlas Setup Guide

This guide will help you set up MongoDB Atlas (cloud MongoDB) for your Script Chunker application.

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" or "Sign Up"
3. Create your account with email/password or Google/GitHub

## Step 2: Create a New Cluster

1. **Choose Deployment Type**: Select "Shared" (Free tier)
2. **Cloud Provider**: Choose your preferred provider (AWS, Google Cloud, or Azure)
3. **Region**: Select a region closest to you for better performance
4. **Cluster Name**: You can keep the default "Cluster0" or rename it
5. Click "Create Cluster" (this takes 3-5 minutes)

## Step 3: Create Database User

1. In the Atlas dashboard, go to **Database Access** (left sidebar)
2. Click "Add New Database User"
3. **Authentication Method**: Choose "Password"
4. **Username**: Create a username (e.g., `scriptchunker`)
5. **Password**: Create a strong password (save this!)
6. **Database User Privileges**: Select "Read and write to any database"
7. Click "Add User"

## Step 4: Configure Network Access

1. Go to **Network Access** (left sidebar)
2. Click "Add IP Address"
3. **For Development**: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. **For Production**: Add your specific IP address
5. Click "Confirm"

## Step 5: Get Connection String

1. Go to **Database** (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. **Driver**: Select "Node.js"
5. **Version**: Select "4.1 or later"
6. Copy the connection string (it looks like this):
   ```
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Configure Your Application

1. Open your `.env` file in the backend folder
2. Replace the `MONGODB_URI` with your Atlas connection string:

```env
# Replace these values with your actual credentials
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb+srv://scriptchunker:your_password@cluster0.xxxxx.mongodb.net/script-chunker?retryWrites=true&w=majority
PORT=5000
```

**Important**: 
- Replace `your_password` with the actual password you created
- Replace `xxxxx` with your actual cluster identifier
- Add `/script-chunker` before the `?` to specify the database name

## Step 7: Test the Connection

1. Save your `.env` file
2. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

3. Look for these success messages:
   ```
   ✅ Connected to MongoDB successfully
   📍 Database: script-chunker
   🌐 Host: cluster0-xxxxx.mongodb.net
   🚀 Server is running on port 5000
   ```

## Troubleshooting

### Common Issues:

1. **Authentication Failed**
   - Check username and password in connection string
   - Ensure user has proper permissions

2. **Network Error**
   - Check if your IP is whitelisted in Network Access
   - Try "Allow Access from Anywhere" for testing

3. **Connection Timeout**
   - Check your internet connection
   - Verify the cluster is running (green status in Atlas)

4. **Invalid Connection String**
   - Ensure you copied the full connection string
   - Check that you replaced `<password>` with actual password
   - Verify the database name is included

### Example Working Connection String:
```
mongodb+srv://scriptchunker:MySecurePass123@cluster0.abc12.mongodb.net/script-chunker?retryWrites=true&w=majority
```

## Security Best Practices

1. **Never commit your `.env` file** - it's already in `.gitignore`
2. **Use strong passwords** for database users
3. **Restrict IP access** in production environments
4. **Rotate passwords** regularly
5. **Use environment-specific clusters** (dev, staging, prod)

## Atlas Dashboard Features

- **Metrics**: Monitor database performance
- **Logs**: View connection and query logs
- **Backup**: Automatic backups (paid tiers)
- **Alerts**: Set up monitoring alerts
- **Data Explorer**: Browse your collections directly

## Free Tier Limitations

- 512 MB storage
- Shared RAM and vCPU
- No backup/restore
- Community support only

For production applications, consider upgrading to a dedicated cluster.

---

Your application is now configured to use MongoDB Atlas! The cloud database will automatically handle scaling, backups, and maintenance.
