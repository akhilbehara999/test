const express = require('express');
const router = express.Router();

// We'll initialize the controller when the app starts
let authController = null;

// Function to initialize the controller with the database connection
function initializeController(db) {
    const AuthController = require('../controllers/authController');
    const User = require('../models/User');
    
    const userModel = new User(db);
    authController = new AuthController(userModel);
}

// Login endpoint
router.post('/login', (req, res) => {
    if (!authController) {
        return res.status(500).json({
            success: false,
            message: 'Authentication service not initialized'
        });
    }
    authController.login(req, res);
});

// Change password endpoint
router.post('/change-password', (req, res) => {
    if (!authController) {
        return res.status(500).json({
            success: false,
            message: 'Authentication service not initialized'
        });
    }
    authController.changePassword(req, res);
});

module.exports = { router, initializeController };