const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// We'll initialize the controller when the app starts
let studyGroupController = null;

// Function to initialize the controller with the database connection
function initializeController(db) {
    const StudyGroupController = require('../controllers/studyGroupController');
    studyGroupController = new StudyGroupController(db);
}

// Create a new study group (authenticated users)
router.post('/', authenticateToken, (req, res) => {
    if (!studyGroupController) {
        return res.status(500).json({
            success: false,
            message: 'Study group service not initialized'
        });
    }
    studyGroupController.createGroup(req, res);
});

// Get all study groups (public access)
router.get('/', (req, res) => {
    if (!studyGroupController) {
        return res.status(500).json({
            success: false,
            message: 'Study group service not initialized'
        });
    }
    studyGroupController.getAllGroups(req, res);
});

// Get a specific study group by ID (public access)
router.get('/:id', (req, res) => {
    if (!studyGroupController) {
        return res.status(500).json({
            success: false,
            message: 'Study group service not initialized'
        });
    }
    studyGroupController.getGroupById(req, res);
});

// Update a study group (authenticated users can update their own groups)
router.put('/:id', authenticateToken, (req, res) => {
    if (!studyGroupController) {
        return res.status(500).json({
            success: false,
            message: 'Study group service not initialized'
        });
    }
    studyGroupController.updateGroup(req, res);
});

// Delete a study group (admin or group creator only)
router.delete('/:id', authenticateToken, (req, res) => {
    if (!studyGroupController) {
        return res.status(500).json({
            success: false,
            message: 'Study group service not initialized'
        });
    }
    studyGroupController.deleteGroup(req, res);
});

// Add a message to a study group (authenticated users)
router.post('/:id/messages', authenticateToken, (req, res) => {
    if (!studyGroupController) {
        return res.status(500).json({
            success: false,
            message: 'Study group service not initialized'
        });
    }
    studyGroupController.addMessage(req, res);
});

// Add a user to a study group (authenticated users)
router.post('/:id/members', authenticateToken, (req, res) => {
    if (!studyGroupController) {
        return res.status(500).json({
            success: false,
            message: 'Study group service not initialized'
        });
    }
    studyGroupController.addUserToGroup(req, res);
});

// Remove a user from a study group (authenticated users)
router.delete('/:id/members', authenticateToken, (req, res) => {
    if (!studyGroupController) {
        return res.status(500).json({
            success: false,
            message: 'Study group service not initialized'
        });
    }
    studyGroupController.removeUserFromGroup(req, res);
});

// Request to join a study group (authenticated users)
router.post('/:id/request', authenticateToken, (req, res) => {
    if (!studyGroupController) {
        return res.status(500).json({
            success: false,
            message: 'Study group service not initialized'
        });
    }
    studyGroupController.requestToJoinGroup(req, res);
});

// Accept a join request (group creator or admin only)
router.post('/:id/accept', authenticateToken, (req, res) => {
    if (!studyGroupController) {
        return res.status(500).json({
            success: false,
            message: 'Study group service not initialized'
        });
    }
    studyGroupController.acceptJoinRequest(req, res);
});

// Reject a join request (group creator or admin only)
router.post('/:id/reject', authenticateToken, (req, res) => {
    if (!studyGroupController) {
        return res.status(500).json({
            success: false,
            message: 'Study group service not initialized'
        });
    }
    studyGroupController.rejectJoinRequest(req, res);
});

// Get pending requests for a user
router.get('/requests', authenticateToken, (req, res) => {
    if (!studyGroupController) {
        return res.status(500).json({
            success: false,
            message: 'Study group service not initialized'
        });
    }
    studyGroupController.getUserPendingRequests(req, res);
});

module.exports = { router, initializeController };