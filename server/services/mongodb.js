const { MongoClient, ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

class MongoDBService {
  constructor() {
    this.client = null;
    this.db = null;
    this.url = 'mongodb://localhost:27017';
    this.dbName = 'chatApp';
  }

  async connect() {
    try {
      console.log('Connecting to MongoDB...');
      this.client = await MongoClient.connect(this.url, {
        useUnifiedTopology: true
      });
      this.db = this.client.db(this.dbName);
      console.log(`Connected to MongoDB database: ${this.dbName}`);
      
      // Initialize collections and indexes
      await this.initializeDatabase();
      
      return true;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('Disconnected from MongoDB');
    }
  }

  // Collection getters
  get users() {
    return this.db.collection('users');
  }

  get groups() {
    return this.db.collection('groups');
  }

  get channels() {
    return this.db.collection('channels');
  }

  get messages() {
    return this.db.collection('messages');
  }

  async initializeDatabase() {
    try {
      // Create indexes for better performance
      await this.users.createIndex({ username: 1 }, { unique: true });
      await this.users.createIndex({ email: 1 }, { unique: true });
      await this.groups.createIndex({ name: 1 });
      await this.channels.createIndex({ groupId: 1 });
      await this.channels.createIndex({ name: 1, groupId: 1 }, { unique: true });
      await this.messages.createIndex({ channelId: 1 });
      await this.messages.createIndex({ timestamp: -1 });

      console.log('MongoDB indexes created successfully');

      // Check if we need to initialize with default data
      const userCount = await this.users.countDocuments();
      if (userCount === 0) {
        await this.initializeDefaultData();
      }

    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async initializeDefaultData() {
    try {
      console.log('Initializing default data...');

      // Create default Super Admin user
      const defaultUser = {
        _id: 'user_001',
        username: 'super',
        email: 'super@chatapp.com',
        password: '123', // Phase 1: plain text password
        role: 'superAdmin',
        groups: [],
        createdAt: new Date(),
        lastLogin: null,
        isActive: true
      };

      await this.users.insertOne(defaultUser);

      // Create default group
      const defaultGroup = {
        _id: 'group_001',
        name: 'General Discussion',
        description: 'Default group for system testing',
        createdBy: 'user_001',
        admins: ['user_001'],
        members: ['user_001'],
        channels: ['channel_001'],
        createdAt: new Date(),
        isActive: true
      };

      await this.groups.insertOne(defaultGroup);

      // Create default channel
      const defaultChannel = {
        _id: 'channel_001',
        name: 'general',
        description: 'Default channel for system testing',
        groupId: 'group_001',
        createdBy: 'user_001',
        members: ['user_001'],
        createdAt: new Date(),
        isActive: true
      };

      await this.channels.insertOne(defaultChannel);

      console.log('Default data initialized successfully');

    } catch (error) {
      console.error('Failed to initialize default data:', error);
      throw error;
    }
  }

  // Users methods (matching fileStorage interface)
  async getUsers() {
    try {
      const users = await this.users.find({ isActive: true }).toArray();
      return {
        users: users,
        metadata: {
          lastModified: new Date().toISOString(),
          version: '2.0',
          totalUsers: users.length
        }
      };
    } catch (error) {
      console.error('Failed to get users:', error);
      return null;
    }
  }

  async saveUsers(usersData) {
    try {
      // This method is for compatibility with existing code
      // In practice, we'll use individual user operations
      console.warn('saveUsers() called - consider using individual user operations');
      return true;
    } catch (error) {
      console.error('Failed to save users:', error);
      return false;
    }
  }

  async createUser(userData) {
    try {
      const user = {
        _id: userData.id || this.generateId('user'),
        ...userData,
        createdAt: new Date(),
        isActive: true
      };
      
      const result = await this.users.insertOne(user);
      return result.acknowledged;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const result = await this.users.updateOne(
        { _id: userId },
        { $set: { ...updateData, lastModified: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const result = await this.users.updateOne(
        { _id: userId },
        { $set: { isActive: false, deletedAt: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  // Groups methods
  async getGroups() {
    try {
      const groups = await this.groups.find({ isActive: true }).toArray();
      return {
        groups: groups,
        metadata: {
          lastModified: new Date().toISOString(),
          version: '2.0',
          totalGroups: groups.length
        }
      };
    } catch (error) {
      console.error('Failed to get groups:', error);
      return null;
    }
  }

  async saveGroups(groupsData) {
    try {
      console.warn('saveGroups() called - consider using individual group operations');
      return true;
    } catch (error) {
      console.error('Failed to save groups:', error);
      return false;
    }
  }

  async createGroup(groupData) {
    try {
      const group = {
        _id: groupData.id || this.generateId('group'),
        ...groupData,
        createdAt: new Date(),
        isActive: true
      };
      
      const result = await this.groups.insertOne(group);
      return result.acknowledged;
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  }

  async updateGroup(groupId, updateData) {
    try {
      const result = await this.groups.updateOne(
        { _id: groupId },
        { $set: { ...updateData, lastModified: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Failed to update group:', error);
      throw error;
    }
  }

  async deleteGroup(groupId) {
    try {
      const result = await this.groups.updateOne(
        { _id: groupId },
        { $set: { isActive: false, deletedAt: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Failed to delete group:', error);
      throw error;
    }
  }

  // Channels methods
  async getChannels() {
    try {
      const channels = await this.channels.find({ isActive: true }).toArray();
      return {
        channels: channels,
        metadata: {
          lastModified: new Date().toISOString(),
          version: '2.0',
          totalChannels: channels.length
        }
      };
    } catch (error) {
      console.error('Failed to get channels:', error);
      return null;
    }
  }

  async saveChannels(channelsData) {
    try {
      console.warn('saveChannels() called - consider using individual channel operations');
      return true;
    } catch (error) {
      console.error('Failed to save channels:', error);
      return false;
    }
  }

  async createChannel(channelData) {
    try {
      const channel = {
        _id: channelData.id || this.generateId('channel'),
        ...channelData,
        createdAt: new Date(),
        isActive: true
      };
      
      const result = await this.channels.insertOne(channel);
      return result.acknowledged;
    } catch (error) {
      console.error('Failed to create channel:', error);
      throw error;
    }
  }

  async updateChannel(channelId, updateData) {
    try {
      const result = await this.channels.updateOne(
        { _id: channelId },
        { $set: { ...updateData, lastModified: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Failed to update channel:', error);
      throw error;
    }
  }

  async deleteChannel(channelId) {
    try {
      const result = await this.channels.updateOne(
        { _id: channelId },
        { $set: { isActive: false, deletedAt: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Failed to delete channel:', error);
      throw error;
    }
  }

  // Messages methods (new for Phase 2)
  async createMessage(messageData) {
    try {
      const message = {
        _id: this.generateId('msg'),
        ...messageData,
        timestamp: new Date()
      };
      
      const result = await this.messages.insertOne(message);
      return result.acknowledged;
    } catch (error) {
      console.error('Failed to create message:', error);
      throw error;
    }
  }

  async getChannelMessages(channelId, limit = 50) {
    try {
      const messages = await this.messages
        .find({ channelId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Failed to get channel messages:', error);
      return [];
    }
  }

  // Utility methods
  generateId(prefix = 'id') {
    return `${prefix}_${uuidv4().split('-')[0]}`;
  }

  // Health check
  async isConnected() {
    try {
      await this.db.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = MongoDBService;
