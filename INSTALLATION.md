# Installation Guide

## Quick Start (Windows)

1. **Double-click `start.bat`** - This will automatically install dependencies and start the application.

## Manual Installation

### Prerequisites
- Node.js (v14 or higher) - [Download here](https://nodejs.org/)
- MongoDB - [Download here](https://www.mongodb.com/try/download/community) or use MongoDB Atlas (cloud)

### Step 1: Install Server Dependencies
```bash
cd server
npm install
```

### Step 2: Install Client Dependencies
```bash
cd ../client
npm install
```

### Step 3: Set up Environment Variables
Create a `.env` file in the `server` directory with:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bus-tracker
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Step 4: Start MongoDB
- **Local MongoDB**: Start MongoDB service
- **MongoDB Atlas**: Use the connection string in your `.env` file

### Step 5: Start the Application
```bash
# From the root directory
npm run dev
```

This will start both the backend server (port 5000) and frontend (port 3000).

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## First Time Setup

1. **Register as Admin**:
   - Go to http://localhost:3000/register
   - Select "Admin" as account type
   - Complete registration

2. **Register as Bus Operator**:
   - Go to http://localhost:3000/register
   - Select "Bus Operator" as account type
   - Fill in driver/conductor details and routes
   - Complete registration

3. **Register as Commuter**:
   - Go to http://localhost:3000/register
   - Select "Commuter" as account type
   - Complete registration

## Troubleshooting

### Port Already in Use
If port 5000 or 3000 is already in use:
- Change PORT in server/.env file
- Update proxy in client/package.json

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in .env file
- For MongoDB Atlas, whitelist your IP address

### Dependencies Issues
- Delete `node_modules` folders
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

## Production Deployment

### Backend
1. Set NODE_ENV=production
2. Use a production MongoDB instance
3. Set a strong JWT_SECRET
4. Deploy to Heroku, AWS, or similar

### Frontend
1. Run `npm run build` in client directory
2. Deploy build folder to Netlify, Vercel, or similar
3. Update API endpoints to production URLs

## Support

If you encounter any issues:
1. Check the console for error messages
2. Ensure all dependencies are installed
3. Verify MongoDB is running
4. Check environment variables

---

**Happy Tracking! 🚌**
