const { ObjectId } = require('mongodb');

class AIConfig {
  constructor(db) {
    this.collection = db.collection('aiconfig');
  }

  async getConfig() {
    try {
      // Get the global configuration (there should only be one)
      const config = await this.collection.findOne({});
      return config;
    } catch (error) {
      throw new Error('Failed to retrieve AI configuration: ' + error.message);
    }
  }

  async updateConfig(configData) {
    try {
      // Update or insert the global configuration
      const result = await this.collection.replaceOne(
        {}, // Match any document (there should only be one)
        {
          ...configData,
          updatedAt: new Date()
        },
        { upsert: true } // Create if doesn't exist
      );
      
      return result.upsertedCount > 0 || result.modifiedCount > 0;
    } catch (error) {
      throw new Error('Failed to update AI configuration: ' + error.message);
    }
  }

  async deleteConfig() {
    try {
      const result = await this.collection.deleteMany({});
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error('Failed to delete AI configuration: ' + error.message);
    }
  }
}

module.exports = AIConfig;