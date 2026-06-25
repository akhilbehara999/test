const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// We'll initialize the controller when the app starts
let aiConfigController = null;

// Function to initialize the controller with the database connection
function initializeController(db) {
    const AIConfigController = require('../controllers/aiConfigController');
    const AIConfig = require('../models/AIConfig');
    
    const aiConfigModel = new AIConfig(db);
    aiConfigController = new AIConfigController(aiConfigModel);
}

// Get global AI configuration (public access)
router.get('/', (req, res) => {
    if (!aiConfigController) {
        return res.status(500).json({
            success: false,
            message: 'AI configuration service not initialized'
        });
    }
    aiConfigController.getGlobalConfig(req, res);
});

// Update global AI configuration (admin only)
router.put('/', authenticateToken, authorizeRole('admin'), (req, res) => {
    if (!aiConfigController) {
        return res.status(500).json({
            success: false,
            message: 'AI configuration service not initialized'
        });
    }
    aiConfigController.updateGlobalConfig(req, res);
});

// Delete global AI configuration (admin only)
router.delete('/', authenticateToken, authorizeRole('admin'), (req, res) => {
    if (!aiConfigController) {
        return res.status(500).json({
            success: false,
            message: 'AI configuration service not initialized'
        });
    }
    aiConfigController.deleteGlobalConfig(req, res);
});

module.exports = { router, initializeController };