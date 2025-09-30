const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import services
const MongoDBService = require('./services/mongodb');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const channelRoutes = require('./routes/channels');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

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

// Start server with MongoDB connection
async function startServer() {
  try {
    // Connect to MongoDB first
    await mongodb.connect();
    console.log('✅ MongoDB connected successfully');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Chat System Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 CORS enabled for: http://localhost:4200`);
      console.log(`🗄️  Database: MongoDB (chatApp)`);
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
