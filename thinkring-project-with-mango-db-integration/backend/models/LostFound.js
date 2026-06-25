const { ObjectId } = require('mongodb');

class LostFound {
  constructor(db) {
    this.collection = db.collection('lostfound');
    // Initialize the collection with an index for better performance
    this.initializeCollection();
  }

  async initializeCollection() {
    try {
      // Create indexes for better query performance
      await this.collection.createIndex({ type: 1 });
      await this.collection.createIndex({ category: 1 });
      await this.collection.createIndex({ reportedAt: -1 });
      await this.collection.createIndex({ deleted: 1 });
      await this.collection.createIndex({ reportedBy: 1 });
      await this.collection.createIndex({ status: 1 });
      await this.collection.createIndex({ location: 1 });
      await this.collection.createIndex({ 
        name: "text", 
        description: "text", 
        location: "text", 
        category: "text" 
      });
      console.log('LostFound collection initialized with indexes');
    } catch (error) {
      console.error('Error initializing LostFound collection:', error);
    }
  }

  async createItem(itemData) {
    const item = {
      name: itemData.name,
      description: itemData.description,
      type: itemData.type, // 'lost' or 'found'
      category: itemData.category,
      date: itemData.date,
      location: itemData.location,
      contact: itemData.contact,
      image: itemData.image, // Base64 encoded image or null
      reportedAt: new Date(),
      reportedBy: itemData.reportedBy || 'anonymous',
      status: 'pending', // 'pending', 'approved', 'resolved'
      isFlagged: false,
      deleted: false // Soft delete flag
    };
    
    const result = await this.collection.insertOne(item);
    return { ...item, _id: result.insertedId };
  }

  async getAllItems() {
    // Only return items that are not deleted
    return await this.collection.find({ deleted: { $ne: true } }).toArray();
  }

  async getAllItemsPaginated(skip, limit) {
    // Only return items that are not deleted with pagination
    return await this.collection.find({ deleted: { $ne: true } })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async getItemById(id) {
    return await this.collection.findOne({ 
      _id: new ObjectId(id),
      deleted: { $ne: true }
    });
  }

  async updateItem(id, updateData) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  }

  async deleteItem(id) {
    // Soft delete - mark as deleted instead of removing from database
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { deleted: true, deletedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async getItemsByType(type) {
    return await this.collection.find({ 
      type: type,
      deleted: { $ne: true }
    }).toArray();
  }

  async getItemsByCategory(category) {
    return await this.collection.find({ 
      category: category,
      deleted: { $ne: true }
    }).toArray();
  }

  async searchItems(query, skip = 0, limit = 20) {
    return await this.collection.find({
      $text: { $search: query },
      deleted: { $ne: true }
    })
    .skip(skip)
    .limit(limit)
    .toArray();
  }
}

module.exports = LostFound;