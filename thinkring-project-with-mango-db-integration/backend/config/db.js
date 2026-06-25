const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const tlsInsecure = process.env.MONGODB_TLS_INSECURE === 'true';

const client = new MongoClient(uri, {
  tlsInsecure: tlsInsecure
});

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('smartcampus');
    console.log('Connected to MongoDB Atlas');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
}

module.exports = { connectDB, getDB, client };