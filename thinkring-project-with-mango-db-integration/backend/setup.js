const fs = require('fs');
const path = require('path');

console.log('Smart Campus Bot Backend Setup');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('\nCreating .env file...');
  
  const envContent = `# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://akhilbehara:7013432177@2006@cluster0.r6z5ekb.mongodb.net/smartcampus?retryWrites=true&w=majority&appName=Cluster0

# Server Configuration
PORT=3000
JWT_SECRET=smartcampus_secret_key_2025

# CORS Configuration
CLIENT_URL=http://localhost:8000
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('.env file created successfully!');
  console.log('Please verify the MongoDB connection string in .env file');
} else {
  console.log('\n.env file already exists. Skipping creation.');
}

console.log('\nSetup completed!');
console.log('\nNext steps:');
console.log('1. Run "npm install" to install dependencies');
console.log('2. Run "npm start" to start the server');
console.log('3. Run "npm run test-connection" to test MongoDB connection');