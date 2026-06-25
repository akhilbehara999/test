const StudyGroup = require('../models/StudyGroup');

class StudyGroupController {
  constructor(db) {
    this.studyGroupModel = new StudyGroup(db);
  }

  async createGroup(req, res) {
    try {
      const groupData = req.body;
      
      // Validate required fields
      if (!groupData.name) {
        return res.status(400).json({
          success: false,
          message: 'Group name is required'
        });
      }

      // Add createdBy from the authenticated user
      groupData.createdBy = req.user ? req.user.username : 'anonymous';
      
      const group = await this.studyGroupModel.createGroup(groupData);
      
      res.status(201).json({
        success: true,
        message: 'Study group created successfully',
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
          createdBy: group.createdBy,
          members: group.members,
          requests: group.requests,
          status: group.status,
          createdAt: group.createdAt
        }
      });
    } catch (error) {
      console.error('Create group error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create study group'
      });
    }
  }

  async getAllGroups(req, res) {
    try {
      const groups = await this.studyGroupModel.getAllGroups();
      
      const groupsFormatted = groups.map(group => ({
        id: group._id,
        name: group.name,
        description: group.description,
        createdBy: group.createdBy,
        members: group.members,
        requests: group.requests,
        status: group.status,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      }));
      
      res.json({
        success: true,
        groups: groupsFormatted
      });
    } catch (error) {
      console.error('Get groups error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve study groups'
      });
    }
  }

  async getGroupById(req, res) {
    try {
      const { id } = req.params;
      const group = await this.studyGroupModel.getGroupById(id);
      
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Study group not found'
        });
      }
      
      res.json({
        success: true,
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
          createdBy: group.createdBy,
          members: group.members,
          requests: group.requests,
          messages: group.messages,
          status: group.status,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt
        }
      });
    } catch (error) {
      console.error('Get group error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve study group'
      });
    }
  }

  async updateGroup(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Remove fields that shouldn't be updated by regular users
      delete updateData.createdAt;
      delete updateData.createdBy;
      
      const updated = await this.studyGroupModel.updateGroup(id, updateData);
      
      if (updated) {
        res.json({
          success: true,
          message: 'Study group updated successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Study group not found'
        });
      }
    } catch (error) {
      console.error('Update group error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update study group'
      });
    }
  }

  async deleteGroup(req, res) {
    try {
      const { id } = req.params;
      const group = await this.studyGroupModel.getGroupById(id);
      
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Study group not found'
        });
      }
      
      // Check if user is admin or the creator of the group
      const user = req.user;
      if (user.role !== 'admin' && user.username !== group.createdBy) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators or group creators can delete groups'
        });
      }
      
      const deleted = await this.studyGroupModel.deleteGroup(id);
      
      if (deleted) {
        res.json({
          success: true,
          message: 'Study group deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Study group not found'
        });
      }
    } catch (error) {
      console.error('Delete group error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete study group'
      });
    }
  }

  async addMessage(req, res) {
    try {
      const { id } = req.params;
      const messageData = req.body;
      
      // Add sender from the authenticated user
      messageData.sender = req.user ? req.user.username : 'anonymous';
      messageData.timestamp = new Date();
      
      const updated = await this.studyGroupModel.addMessage(id, messageData);
      
      if (updated) {
        res.json({
          success: true,
          message: 'Message added successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Study group not found'
        });
      }
    } catch (error) {
      console.error('Add message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add message'
      });
    }
  }

  async addUserToGroup(req, res) {
    try {
      const { id } = req.params;
      const { username } = req.body;
      
      const updated = await this.studyGroupModel.addUserToGroup(id, username);
      
      if (updated) {
        res.json({
          success: true,
          message: 'User added to group successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Study group not found'
        });
      }
    } catch (error) {
      console.error('Add user to group error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add user to group'
      });
    }
  }

  async removeUserFromGroup(req, res) {
    try {
      const { id } = req.params;
      const { username } = req.body;
      
      const updated = await this.studyGroupModel.removeUserFromGroup(id, username);
      
      if (updated) {
        res.json({
          success: true,
          message: 'User removed from group successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Study group not found'
        });
      }
    } catch (error) {
      console.error('Remove user from group error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove user from group'
      });
    }
  }

  // New method to handle join requests
  async requestToJoinGroup(req, res) {
    try {
      const { id } = req.params;
      const username = req.user ? req.user.username : 'anonymous';
      
      // Check if user is already a member
      const group = await this.studyGroupModel.getGroupById(id);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Study group not found'
        });
      }
      
      if (group.members && group.members.includes(username)) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this group'
        });
      }
      
      // Add join request
      const updated = await this.studyGroupModel.addJoinRequest(id, username);
      
      if (updated) {
        res.json({
          success: true,
          message: 'Join request sent successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to send join request. You may have already requested to join.'
        });
      }
    } catch (error) {
      console.error('Request to join group error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send join request'
      });
    }
  }

  // New method to accept a join request
  async acceptJoinRequest(req, res) {
    try {
      const { id } = req.params;
      const { username } = req.body;
      
      // Check if requesting user has permission (group creator or admin)
      const group = await this.studyGroupModel.getGroupById(id);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Study group not found'
        });
      }
      
      const user = req.user;
      if (user.role !== 'admin' && user.username !== group.createdBy) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators or group creators can accept join requests'
        });
      }
      
      // Accept the request by adding user to group
      const updated = await this.studyGroupModel.addUserToGroup(id, username);
      
      if (updated) {
        res.json({
          success: true,
          message: 'Join request accepted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Study group not found'
        });
      }
    } catch (error) {
      console.error('Accept join request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to accept join request'
      });
    }
  }

  // New method to reject a join request
  async rejectJoinRequest(req, res) {
    try {
      const { id } = req.params;
      const { username } = req.body;
      
      // Check if requesting user has permission (group creator or admin)
      const group = await this.studyGroupModel.getGroupById(id);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Study group not found'
        });
      }
      
      const user = req.user;
      if (user.role !== 'admin' && user.username !== group.createdBy) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators or group creators can reject join requests'
        });
      }
      
      // Reject the request by removing it from requests
      const updated = await this.studyGroupModel.removeJoinRequest(id, username);
      
      if (updated) {
        res.json({
          success: true,
          message: 'Join request rejected successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Study group not found'
        });
      }
    } catch (error) {
      console.error('Reject join request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject join request'
      });
    }
  }

  // New method to get pending requests for a user
  async getUserPendingRequests(req, res) {
    try {
      const username = req.user ? req.user.username : 'anonymous';
      
      // Get all groups where this user has pending requests
      const groups = await this.studyGroupModel.collection.find({
        requests: username
      }).toArray();
      
      const requests = groups.map(group => ({
        groupId: group._id,
        groupName: group.name,
        requestedAt: group.updatedAt // Using updatedAt as requestedAt
      }));
      
      res.json({
        success: true,
        requests: requests
      });
    } catch (error) {
      console.error('Get user pending requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending requests'
      });
    }
  }
}

module.exports = StudyGroupController;