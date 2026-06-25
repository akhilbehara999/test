const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { connectDB } = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const lostFoundRoutes = require('./routes/lostFound');
const aiConfigRoutes = require('./routes/aiConfig');
const studyGroupsRoutes = require('./routes/studyGroups');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:3000', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB and initialize routes
connectDB().then(async (db) => {
  console.log('Database connected successfully');
  
  // Initialize route controllers with database connection
  authRoutes.initializeController(db);
  usersRoutes.initializeController(db);
  lostFoundRoutes.initializeController(db);
  aiConfigRoutes.initializeController(db);
  studyGroupsRoutes.initializeController(db);
  
  // Import User model and initialize default users
  const User = require('./models/User');
  const userModel = new User(db);
  await userModel.initializeDefaultUsers();
  
  console.log('Database initialized');
  
  // Now that everything is initialized, set up the routes
  app.use('/api/auth', authRoutes.router);
  app.use('/api/users', usersRoutes.router);
  app.use('/api/lostfound', lostFoundRoutes.router);
  app.use('/api/aiconfig', aiConfigRoutes.router);
  app.use('/api/studygroups', studyGroupsRoutes.router);
  
}).catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Smart Campus Bot API is running',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Smart Campus Bot API server running on port ${PORT}`);
  console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
});