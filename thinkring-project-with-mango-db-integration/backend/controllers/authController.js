const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class AuthController {
  constructor(userModel) {
    this.userModel = userModel;
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      // Find user by username
      let user = await this.userModel.findByUsername(username);
      
      // If user doesn't exist, reject login (don't auto-create users)
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Check if account is suspended
      if (user.status === 'suspended') {
        return res.status(401).json({
          success: false,
          message: 'Account is suspended'
        });
      }
      
      // Check if account is locked
      if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
        return res.status(401).json({
          success: false,
          message: 'Account temporarily locked due to failed login attempts',
          lockout: true
        });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        // Increment login attempts
        const newAttempts = (user.loginAttempts || 0) + 1;
        const maxAttempts = 5;
        const lockoutDuration = 15 * 60 * 1000; // 15 minutes
        
        let updateData = { loginAttempts: newAttempts };
        
        if (newAttempts >= maxAttempts) {
          updateData.lockedUntil = new Date(Date.now() + lockoutDuration);
          await this.userModel.updateUser(user._id, updateData);
          
          return res.status(401).json({
            success: false,
            message: `Account locked for 15 minutes after ${maxAttempts} failed attempts`,
            lockout: true
          });
        } else {
          await this.userModel.updateUser(user._id, updateData);
          
          return res.status(401).json({
            success: false,
            message: `Invalid credentials (${newAttempts}/${maxAttempts} attempts)`
          });
        }
      }
      
      // Reset login attempts on successful login
      await this.userModel.updateUser(user._id, {
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date().toLocaleString()
      });
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user._id, 
          username: user.username, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Return user data without password
      const userData = {
        id: user._id,
        username: user.username,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin
      };
      
      res.json({
        success: true,
        message: 'Authentication successful',
        token,
        user: userData
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication service temporarily unavailable'
      });
    }
  }
  
  async changePassword(req, res) {
    try {
      const { userId, currentPassword, newPassword } = req.body;
      
      // Find user by ID
      const user = await this.userModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      const updated = await this.userModel.updateUser(userId, {
        password: hashedPassword,
        loginAttempts: 0,
        lockedUntil: null
      });
      
      if (updated) {
        res.json({
          success: true,
          message: 'Password changed successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update password'
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        success: false,
        message: 'Password change service temporarily unavailable'
      });
    }
  }
}

module.exports = AuthController;