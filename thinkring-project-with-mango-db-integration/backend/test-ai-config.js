// Test script to check if AI configuration API is working
const { connectDB } = require('./config/db');
const AIConfig = require('./models/AIConfig');

async function testAIConfig() {
  try {
    console.log('Testing AI configuration API...');
    
    // Connect to database
    const db = await connectDB();
    console.log('Database connected successfully');
    
    // Initialize AI config model
    const aiConfigModel = new AIConfig(db);
    
    // Test getting config (should return null if not set)
    const config = await aiConfigModel.getConfig();
    console.log('Current config:', config);
    
    // Test updating config
    const testConfig = {
      apiKey: 'test-api-key-123',
      model: 'test-model',
      updatedBy: 'test-user',
      updatedAt: new Date()
    };
    
    const updated = await aiConfigModel.updateConfig(testConfig);
    console.log('Update result:', updated);
    
    // Test getting config again
    const newConfig = await aiConfigModel.getConfig();
    console.log('New config:', newConfig);
    
    console.log('Test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testAIConfig();