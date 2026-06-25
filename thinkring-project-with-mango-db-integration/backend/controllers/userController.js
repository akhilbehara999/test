class UserController {
  constructor(userModel) {
    this.userModel = userModel;
  }

  async getAllUsers(req, res) {
    try {
      const users = await this.userModel.getAllUsers();
      
      // Remove sensitive data
      const sanitizedUsers = users.map(user => {
        const { password, ...userData } = user;
        return {
          ...userData,
          id: user._id
        };
      });
      
      res.json({
        success: true,
        users: sanitizedUsers
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users'
      });
    }
  }

  async createUser(req, res) {
    try {
      const userData = req.body;
      
      // Validate required fields
      if (!userData.username || !userData.password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }
      
      // Check if username already exists
      const existingUser = await this.userModel.findByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
      
      // Validate password strength (basic validation)
      if (userData.password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }
      
      // Create user
      const user = await this.userModel.createUser(userData);
      
      // Return user data without password
      const { password, ...userDataWithoutPassword } = user;
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: {
          ...userDataWithoutPassword,
          id: user._id
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      // Prevent deletion of default users
      const user = await this.userModel.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if this is a default user (you might want to adjust this logic)
      const defaultUsers = ['student', 'KAB', 'testuser'];
      if (defaultUsers.includes(user.username)) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete default system users'
        });
      }
      
      const deleted = await this.userModel.deleteUser(id);
      
      if (deleted) {
        res.json({
          success: true,
          message: 'User deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  }
}

module.exports = UserController;