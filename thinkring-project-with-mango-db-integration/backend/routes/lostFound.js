const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// We'll initialize the controller when the app starts
let lostFoundController = null;

// Function to initialize the controller with the database connection
function initializeController(db) {
    const LostFoundController = require('../controllers/lostFoundController');
    lostFoundController = new LostFoundController(db);
}

// Create a new lost/found item (public access - anyone can report items)
router.post('/', (req, res) => {
    if (!lostFoundController) {
        return res.status(500).json({
            success: false,
            message: 'Lost and found service not initialized'
        });
    }
    lostFoundController.createItem(req, res);
});

// Get all items (public access)
router.get('/', (req, res) => {
    if (!lostFoundController) {
        return res.status(500).json({
            success: false,
            message: 'Lost and found service not initialized'
        });
    }
    lostFoundController.getAllItems(req, res);
});

// Get a specific item by ID (public access)
router.get('/:id', (req, res) => {
    if (!lostFoundController) {
        return res.status(500).json({
            success: false,
            message: 'Lost and found service not initialized'
        });
    }
    lostFoundController.getItemById(req, res);
});

// Search items (public access)
router.get('/search', (req, res) => {
    if (!lostFoundController) {
        return res.status(500).json({
            success: false,
            message: 'Lost and found service not initialized'
        });
    }
    lostFoundController.searchItems(req, res);
});

// Update an item (authenticated users can update their own items)
router.put('/:id', authenticateToken, (req, res) => {
    if (!lostFoundController) {
        return res.status(500).json({
            success: false,
            message: 'Lost and found service not initialized'
        });
    }
    lostFoundController.updateItem(req, res);
});

// Delete an item (admin only)
router.delete('/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
    if (!lostFoundController) {
        return res.status(500).json({
            success: false,
            message: 'Lost and found service not initialized'
        });
    }
    lostFoundController.deleteItem(req, res);
});

module.exports = { router, initializeController };