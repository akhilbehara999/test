const AIConfig = require('../models/AIConfig');

class AIConfigController {
  constructor(aiConfigModel) {
    this.aiConfigModel = aiConfigModel;
  }

  async getGlobalConfig(req, res) {
    try {
      const config = await this.aiConfigModel.getConfig();
      
      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'AI configuration not found'
        });
      }
      
      // Return config without sensitive _id field
      const { _id, ...configData } = config;
      
      // Log a safe version of the config without the API key
      const safeConfig = { ...configData };
      if (safeConfig.apiKey) {
        safeConfig.apiKey = '[REDACTED]';
      }
      console.log('Sending AI config (safe version):', safeConfig);
      
      res.json({
        success: true,
        config: configData
      });
    } catch (error) {
      console.error('Get AI config error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve AI configuration'
      });
    }
  }

  async updateGlobalConfig(req, res) {
    try {
      // Only admin users should be able to update configuration
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can update AI configuration'
        });
      }
      
      const { apiKey, model } = req.body;
      
      // Validate required fields
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          message: 'API key is required'
        });
      }
      
      if (!model) {
        return res.status(400).json({
          success: false,
          message: 'Model is required'
        });
      }
      
      const configData = {
        apiKey,
        model,
        updatedBy: req.user.username,
        updatedAt: new Date()
      };
      
      const updated = await this.aiConfigModel.updateConfig(configData);
      
      if (updated) {
        res.json({
          success: true,
          message: 'AI configuration updated successfully',
          config: configData
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update AI configuration'
        });
      }
    } catch (error) {
      console.error('Update AI config error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update AI configuration'
      });
    }
  }

  async deleteGlobalConfig(req, res) {
    try {
      // Only admin users should be able to delete configuration
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can delete AI configuration'
        });
      }
      
      const deleted = await this.aiConfigModel.deleteConfig();
      
      if (deleted) {
        res.json({
          success: true,
          message: 'AI configuration deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'AI configuration not found'
        });
      }
    } catch (error) {
      console.error('Delete AI config error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete AI configuration'
      });
    }
  }
}

module.exports = AIConfigController;