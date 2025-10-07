const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// CORS middleware
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));

// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Test database injection middleware - MUST come before routes
let testDatabase = null;

function injectTestDatabase(db) {
  testDatabase = db;
}

// Database injection middleware
app.use((req, res, next) => {
  if (testDatabase) {
    req.mongodb = {
      users: testDatabase.collection('users'),
      groups: testDatabase.collection('groups'),
      channels: testDatabase.collection('channels'),
      messages: testDatabase.collection('messages')
    };
  }
  next();
});

// Import and mount routes AFTER middleware
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const groupRoutes = require('../routes/groups');
const channelRoutes = require('../routes/channels');
const uploadRoutes = require('../routes/upload');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/upload', uploadRoutes);

// Export both app and the injection function
module.exports = {
  app,
  injectTestDatabase
};