const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Import services
const MongoDBService = require('./services/mongodb');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const channelRoutes = require('./routes/channels');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize MongoDB service
const mongodb = new MongoDBService();

// Middleware
app.use(cors({
  origin: 'http://localhost:4200', // Angular development server
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Make MongoDB service available to all routes
app.use((req, res, next) => {
  req.mongodb = mongodb;
  req.io = io; // Make Socket.io available to routes
  // Keep fileStorage for backward compatibility during transition
  req.fileStorage = mongodb;
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/channels', channelRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const mongoStatus = await mongodb.isConnected();
  res.json({ 
    status: mongoStatus ? 'OK' : 'WARNING', 
    message: 'Chat System Server is running',
    database: {
      type: 'MongoDB',
      status: mongoStatus ? 'Connected' : 'Disconnected',
      name: 'chatApp'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An internal server error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Endpoint not found'
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join a channel room
  socket.on('join-channel', async (data) => {
    try {
      const { channelId, userId, username } = data;
      console.log(`👤 ${username} joining channel: ${channelId}`);
      
      // Join the channel room
      socket.join(channelId);
      
      // Load and send message history (last 50 messages)
      const messages = await mongodb.messages.find({ channelId })
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray();
      
      // Send history in chronological order
      socket.emit('channel-history', messages.reverse());
      
      // Notify others in the channel
      socket.to(channelId).emit('user-joined', {
        username,
        message: `${username} joined the channel`,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Join channel error:', error);
      socket.emit('error', { message: 'Failed to join channel' });
    }
  });

  // Leave a channel room
  socket.on('leave-channel', (data) => {
    const { channelId, username } = data;
    console.log(`👤 ${username} leaving channel: ${channelId}`);
    
    socket.leave(channelId);
    
    // Notify others in the channel
    socket.to(channelId).emit('user-left', {
      username,
      message: `${username} left the channel`,
      timestamp: new Date()
    });
  });

  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { channelId, userId, username, content, type = 'text' } = data;
      
      // Create message object
      const message = {
        _id: mongodb.generateId('msg'),
        channelId,
        userId,
        username,
        content,
        type,
        timestamp: new Date()
      };
      
      // Save message to MongoDB
      await mongodb.messages.insertOne(message);
      
      // Add id field for frontend compatibility
      const messageWithId = {
        ...message,
        id: message._id
      };
      
      // Broadcast message to all users in the channel
      io.to(channelId).emit('message', messageWithId);
      
      console.log(`💬 Message from ${username} in ${channelId}: ${content}`);
      
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators (optional feature)
  socket.on('typing', (data) => {
    const { channelId, username } = data;
    socket.to(channelId).emit('user-typing', { username });
  });

  socket.on('stop-typing', (data) => {
    const { channelId, username } = data;
    socket.to(channelId).emit('user-stop-typing', { username });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// Start server with MongoDB connection
async function startServer() {
  try {
    // Connect to MongoDB first
    await mongodb.connect();
    console.log('✅ MongoDB connected successfully');

    // Start HTTP server (with Socket.io)
    server.listen(PORT, () => {
      console.log(`🚀 Chat System Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 CORS enabled for: http://localhost:4200`);
      console.log(`🗄️  Database: MongoDB (chatApp)`);
      console.log(`🔌 Socket.io enabled for real-time chat`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown for multiple signals
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down server gracefully...`);
  try {
    await mongodb.disconnect();
    console.log('✅ MongoDB disconnected');
    console.log('✅ Server shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle different termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Process termination
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT')); // Quit signal

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();
