const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

class User {
  constructor(db) {
    this.collection = db.collection('users');
  }

  async initializeDefaultUsers() {
    const count = await this.collection.countDocuments();
    if (count === 0) {
      // Create default users with hashed passwords
      const defaultUsers = [
        {
          username: 'student',
          role: 'student',
          status: 'active',
          password: await bcrypt.hash('password123', 10),
          lastLogin: 'N/A',
          loginAttempts: 0,
          lockedUntil: null,
          createdAt: new Date()
        },
        {
          username: 'KAB',
          role: 'admin',
          status: 'active',
          password: await bcrypt.hash('7013432177@akhil', 10),
          lastLogin: 'N/A',
          loginAttempts: 0,
          lockedUntil: null,
          createdAt: new Date()
        },
        {
          username: 'testuser',
          role: 'student',
          status: 'suspended',
          password: await bcrypt.hash('password', 10),
          lastLogin: '2025-08-16',
          loginAttempts: 0,
          lockedUntil: null,
          createdAt: new Date()
        }
      ];

      await this.collection.insertMany(defaultUsers);
      console.log('Default users initialized');
    }
  }

  async findByUsername(username) {
    return await this.collection.findOne({ username });
  }

  async findById(id) {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async createUser(userData) {
    // Hash the password if it's not already hashed
    const passwordToStore = userData.password.startsWith('$2b$') 
      ? userData.password 
      : await bcrypt.hash(userData.password, 10);
      
    const user = {
      username: userData.username,
      role: userData.role || 'student',
      status: userData.status || 'active',
      password: passwordToStore,
      lastLogin: userData.lastLogin || 'N/A',
      loginAttempts: userData.loginAttempts || 0,
      lockedUntil: userData.lockedUntil || null,
      createdAt: new Date()
    };
    
    const result = await this.collection.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async updateUser(userId, updateData) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  }

  async deleteUser(userId) {
    try {
      const result = await this.collection.deleteOne({ _id: new ObjectId(userId) });
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error('Failed to delete user: ' + error.message);
    }
  }

  async getAllUsers() {
    return await this.collection.find({}).toArray();
  }
}

module.exports = User;