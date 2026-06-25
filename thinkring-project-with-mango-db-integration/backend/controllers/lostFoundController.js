const LostFound = require('../models/LostFound');

class LostFoundController {
  constructor(db) {
    this.lostFoundModel = new LostFound(db);
  }

  async createItem(req, res) {
    try {
      const itemData = req.body;
      console.log('Received item data:', itemData);
      
      // Validate required fields
      if (!itemData.name || !itemData.description || !itemData.type || 
          !itemData.category || !itemData.date || !itemData.location || 
          !itemData.contact) {
        console.log('Validation failed for item data:', itemData);
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      // Add reportedBy from the authenticated user or set as anonymous
      itemData.reportedBy = req.user ? req.user.username : 'anonymous';
      console.log('Item data with reportedBy:', itemData);

      const item = await this.lostFoundModel.createItem(itemData);
      console.log('Created item:', item);
      
      // Remove sensitive data before sending response
      const { contact, ...itemWithoutContact } = item;
      
      res.status(201).json({
        success: true,
        message: 'Item reported successfully',
        item: itemWithoutContact
      });
    } catch (error) {
      console.error('Create item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to report item'
      });
    }
  }

  async getAllItems(req, res) {
    try {
      const items = await this.lostFoundModel.getAllItems();
      
      // Remove sensitive data before sending response
      const itemsWithoutContact = items.map(item => {
        const { contact, ...itemWithoutContact } = item;
        return {
          ...itemWithoutContact,
          id: item._id
        };
      });
      
      res.json({
        success: true,
        items: itemsWithoutContact
      });
    } catch (error) {
      console.error('Get items error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve items'
      });
    }
  }

  async getItemById(req, res) {
    try {
      const { id } = req.params;
      const item = await this.lostFoundModel.getItemById(id);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
      
      // For individual item requests, we can include more details
      const { contact, ...itemWithoutContact } = item;
      
      res.json({
        success: true,
        item: {
          ...itemWithoutContact,
          id: item._id
        }
      });
    } catch (error) {
      console.error('Get item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve item'
      });
    }
  }

  async updateItem(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Remove fields that shouldn't be updated by regular users
      delete updateData.reportedAt;
      delete updateData.reportedBy;
      delete updateData.deleted;
      
      const updated = await this.lostFoundModel.updateItem(id, updateData);
      
      if (updated) {
        res.json({
          success: true,
          message: 'Item updated successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
    } catch (error) {
      console.error('Update item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update item'
      });
    }
  }

  async deleteItem(req, res) {
    try {
      // Only admins should be able to delete items
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can delete items'
        });
      }
      
      const { id } = req.params;
      const deleted = await this.lostFoundModel.deleteItem(id);
      
      if (deleted) {
        res.json({
          success: true,
          message: 'Item deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
    } catch (error) {
      console.error('Delete item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete item'
      });
    }
  }

  async searchItems(req, res) {
    try {
      const { query } = req.query;
      if (!query) {
        return this.getAllItems(req, res);
      }
      
      const items = await this.lostFoundModel.searchItems(query);
      
      // Remove sensitive data before sending response
      const itemsWithoutContact = items.map(item => {
        const { contact, ...itemWithoutContact } = item;
        return {
          ...itemWithoutContact,
          id: item._id
        };
      });
      
      res.json({
        success: true,
        items: itemsWithoutContact
      });
    } catch (error) {
      console.error('Search items error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search items'
      });
    }
  }
}

module.exports = LostFoundController;