const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const busRoutes = require('./routes/bus');
const ticketRoutes = require('./routes/ticket');
const adminRoutes = require('./routes/admin');
const complaintRoutes = require('./routes/complaint');

const app = express();
const server = http.createServer(app);

// Determine allowed origins (comma-separated in env or default localhost)
const allowedOrigins = (process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ["http://localhost:3000", "http://localhost:3001"]) || [];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Health check endpoint for deployment platforms
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bus-tracker';

console.log('[DB] Connecting to MongoDB...');
console.log(`[DB] Using URI: ${MONGODB_URI.replace(/:\/\/([^:@]*):([^@]*)@/,'://****:****@')}`);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('[DB] MongoDB connected successfully');
}).catch((err) => {
  console.error('[DB] MongoDB connection error:', err.message);
});

mongoose.connection.on('error', (err) => {
  console.error('[DB] Connection error event:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/ticket', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/complaint', complaintRoutes);

// Socket.io for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join bus room for real-time tracking
  socket.on('join-bus', (busId) => {
    socket.join(`bus-${busId}`);
    console.log(`User joined bus room: ${busId}`);
  });

  // Leave bus room
  socket.on('leave-bus', (busId) => {
    socket.leave(`bus-${busId}`);
    console.log(`User left bus room: ${busId}`);
  });

  // Update bus location
  socket.on('update-location', (data) => {
    const { busId, location, crowdCount } = data;
    socket.to(`bus-${busId}`).emit('location-update', {
      busId,
      location,
      crowdCount,
      timestamp: new Date()
    });
  });

  // Update crowd count
  socket.on('update-crowd', (data) => {
    const { busId, crowdCount } = data;
    socket.to(`bus-${busId}`).emit('crowd-update', {
      busId,
      crowdCount,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

const PORT = process.env.PORT || 4600;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
