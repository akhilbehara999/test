const { connectDB } = require('./config/db');
const AIConfig = require('./models/AIConfig');

async function checkAIConfig() {
  try {
    // Connect to the database
    await connectDB();
    
    // Create AIConfig instance
    const db = require('./config/db').client.db('smartcampus');
    const aiConfig = new AIConfig(db);
    
    // Get the current configuration
    const config = await aiConfig.getConfig();
    
    if (config) {
      console.log('Current AI Configuration:');
      console.log('API Key:', config.apiKey);
      console.log('Model:', config.model);
      console.log('Updated By:', config.updatedBy);
      console.log('Updated At:', config.updatedAt);
    } else {
      console.log('No AI configuration found in the database.');
    }
    
    // Close the connection
    await require('./config/db').client.close();
  } catch (error) {
    console.error('Error checking AI configuration:', error.message);
    process.exit(1);
  }
}

checkAIConfig();