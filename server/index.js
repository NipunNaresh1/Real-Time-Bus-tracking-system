const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const authRoutes = require('./routes/auth');
const busRoutes = require('./routes/bus');
const ticketRoutes = require('./routes/ticket');
const adminRoutes = require('./routes/admin');
const complaintRoutes = require('./routes/complaint');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));
app.use(express.json());

// Database connection
mongoose.connect('mongodb://localhost:27017/bus-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
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

const PORT = 4600;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
