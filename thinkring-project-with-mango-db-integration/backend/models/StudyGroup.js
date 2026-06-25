const { ObjectId } = require('mongodb');

class StudyGroup {
  constructor(db) {
    this.collection = db.collection('study_groups');
  }

  async createGroup(groupData) {
    const group = {
      name: groupData.name,
      description: groupData.description,
      createdBy: groupData.createdBy,
      members: groupData.members || [groupData.createdBy],
      requests: groupData.requests || [], // Add requests array
      messages: groupData.messages || [],
      status: groupData.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(group);
    return { ...group, _id: result.insertedId };
  }

  async getAllGroups() {
    return await this.collection.find({ status: 'active' }).sort({ createdAt: -1 }).toArray();
  }

  async getGroupById(id) {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async updateGroup(id, updateData) {
    updateData.updatedAt = new Date();
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  }

  async deleteGroup(id) {
    try {
      const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error('Failed to delete group: ' + error.message);
    }
  }

  async addMessage(groupId, message) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(groupId) },
      { 
        $push: { messages: message },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  async addUserToGroup(groupId, username) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(groupId) },
      { 
        $addToSet: { members: username },
        $pull: { requests: username }, // Remove from requests when accepted
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  async removeUserFromGroup(groupId, username) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(groupId) },
      { 
        $pull: { members: username, requests: username }, // Remove from both members and requests
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  // New method to add a join request
  async addJoinRequest(groupId, username) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(groupId), requests: { $ne: username } }, // Only add if not already requested
      { 
        $addToSet: { requests: username },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  // New method to remove a join request (when accepted or rejected)
  async removeJoinRequest(groupId, username) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(groupId) },
      { 
        $pull: { requests: username },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }
}

module.exports = StudyGroup;