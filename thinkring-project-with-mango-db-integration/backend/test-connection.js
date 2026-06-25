const { connectDB, getDB } = require('./config/db');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    const db = await connectDB();
    
    // Test basic operations
    const usersCollection = db.collection('users');
    const count = await usersCollection.countDocuments();
    console.log(`Connected successfully! Found ${count} users in the database.`);
    
    console.log('Connection test completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Connection test failed:', error);
    process.exit(1);
  }
}

testConnection();