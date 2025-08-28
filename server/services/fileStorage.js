const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class FileStorageService {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.backupPath = path.join(this.dataPath, 'backups');
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      // Ensure data and backup directories exist
      await this.ensureDirectoryExists(this.dataPath);
      await this.ensureDirectoryExists(this.backupPath);

      // Initialize default data files if they don't exist
      await this.initializeDataFiles();
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async readData(filename) {
    try {
      const filePath = path.join(this.dataPath, filename);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Failed to read ${filename}:`, error);
      return null;
    }
  }

  async writeData(filename, data) {
    try {
      const filePath = path.join(this.dataPath, filename);
      
      // Create backup before writing
      await this.createBackup(filename);
      
      // Update metadata
      data.metadata = {
        ...data.metadata,
        lastModified: new Date().toISOString(),
        version: '1.0'
      };

      // Write data to file
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Failed to write ${filename}:`, error);
      return false;
    }
  }

  async createBackup(filename) {
    try {
      const sourceFile = path.join(this.dataPath, filename);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupPath, `${filename.split('.')[0]}_backup_${timestamp}.json`);
      
      // Check if source file exists
      try {
        await fs.access(sourceFile);
        await fs.copyFile(sourceFile, backupFile);
      } catch {
        // Source file doesn't exist, skip backup
      }
    } catch (error) {
      console.error(`Failed to create backup for ${filename}:`, error);
    }
  }

  async initializeDataFiles() {
    // Initialize users.json with default Super Admin
    const usersFile = path.join(this.dataPath, 'users.json');
    try {
      await fs.access(usersFile);
    } catch {
      const defaultUsers = {
        users: [
          {
            id: 'user_001',
            username: 'super',
            email: 'super@chatapp.com',
            password: '123', // In Phase 1, we store plain text passwords
            role: 'superAdmin',  // Changed from roles array to single role
            groups: [],
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isActive: true
          }
        ],
        metadata: {
          lastModified: new Date().toISOString(),
          version: '1.0',
          totalUsers: 1,
          nextId: 'user_002'
        }
      };
      await fs.writeFile(usersFile, JSON.stringify(defaultUsers, null, 2));
    }

    // Initialize groups.json
    const groupsFile = path.join(this.dataPath, 'groups.json');
    try {
      await fs.access(groupsFile);
    } catch {
      const defaultGroups = {
        groups: [
          {
            id: 'group_001',
            name: 'General Discussion',
            description: 'Default group for system testing',
            createdBy: 'user_001',
            admins: ['user_001'],
            members: ['user_001'],
            channels: ['channel_001'],
            createdAt: new Date().toISOString(),
            isActive: true
          }
        ],
        metadata: {
          lastModified: new Date().toISOString(),
          version: '1.0',
          totalGroups: 1,
          nextId: 'group_002'
        }
      };
      await fs.writeFile(groupsFile, JSON.stringify(defaultGroups, null, 2));
    }

    // Initialize channels.json
    const channelsFile = path.join(this.dataPath, 'channels.json');
    try {
      await fs.access(channelsFile);
    } catch {
      const defaultChannels = {
        channels: [
          {
            id: 'channel_001',
            name: 'general',
            description: 'Default channel for system testing',
            groupId: 'group_001',
            createdBy: 'user_001',
            members: ['user_001'],
            createdAt: new Date().toISOString(),
            isActive: true
          }
        ],
        metadata: {
          lastModified: new Date().toISOString(),
          version: '1.0',
          totalChannels: 1,
          nextId: 'channel_002'
        }
      };
      await fs.writeFile(channelsFile, JSON.stringify(defaultChannels, null, 2));
    }
  }

  // Specific data access methods
  async getUsers() {
    return this.readData('users.json');
  }

  async saveUsers(users) {
    return this.writeData('users.json', users);
  }

  async getGroups() {
    return this.readData('groups.json');
  }

  async saveGroups(groups) {
    return this.writeData('groups.json', groups);
  }

  async getChannels() {
    return this.readData('channels.json');
  }

  async saveChannels(channels) {
    return this.writeData('channels.json', channels);
  }

  // Generate unique IDs
  generateId(prefix = 'id') {
    return `${prefix}_${uuidv4().split('-')[0]}`;
  }
}

module.exports = FileStorageService;
