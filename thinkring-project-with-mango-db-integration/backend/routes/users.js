const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// We'll initialize the controller when the app starts
let userController = null;

// Function to initialize the controller with the database connection
function initializeController(db) {
    const UserController = require('../controllers/userController');
    const User = require('../models/User');
    
    const userModel = new User(db);
    userController = new UserController(userModel);
}

// Public endpoint for user registration
router.post('/register', (req, res) => {
    if (!userController) {
        return res.status(500).json({
            success: false,
            message: 'User service not initialized'
        });
    }
    userController.createUser(req, res);
});

// Get all users (admin only)
router.get('/', authenticateToken, authorizeRole('admin'), (req, res) => {
    if (!userController) {
        return res.status(500).json({
            success: false,
            message: 'User service not initialized'
        });
    }
    userController.getAllUsers(req, res);
});

// Create user (admin only)
router.post('/', authenticateToken, authorizeRole('admin'), (req, res) => {
    if (!userController) {
        return res.status(500).json({
            success: false,
            message: 'User service not initialized'
        });
    }
    userController.createUser(req, res);
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
    if (!userController) {
        return res.status(500).json({
            success: false,
            message: 'User service not initialized'
        });
    }
    userController.deleteUser(req, res);
});

module.exports = { router, initializeController };