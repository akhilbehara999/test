const { connectDB } = require('./config/db');
const AIConfig = require('./models/AIConfig');

async function updateAIConfig() {
  try {
    // Connect to MongoDB
    const db = await connectDB();
    console.log('Connected to MongoDB Atlas');
    
    // Initialize AIConfig model
    const aiConfig = new AIConfig(db);
    
    // Get current config
    const currentConfig = await aiConfig.getConfig();
    console.log('Current AI Configuration:', currentConfig);
    
    // Update the model to a more reliable one
    if (currentConfig) {
      const updatedConfig = {
        apiKey: currentConfig.apiKey,
        model: 'openai/gpt-3.5-turbo', // Using a more reliable model
        updatedBy: currentConfig.updatedBy || 'system',
        updatedAt: new Date()
      };
      
      const result = await aiConfig.updateConfig(updatedConfig);
      if (result) {
        console.log('AI Configuration updated successfully!');
        console.log('New Configuration:', {
          ...updatedConfig,
          apiKey: '[REDACTED]' // Don't log the actual API key
        });
      } else {
        console.log('Failed to update AI Configuration');
      }
    } else {
      console.log('No AI Configuration found in database');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating AI configuration:', error);
    process.exit(1);
  }
}

updateAIConfig();