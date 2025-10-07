const { MongoClient } = require('mongodb');

// Test database configuration
const TEST_DB_URL = 'mongodb://localhost:27017';
const TEST_DB_NAME = 'chatApp_test';

let testDb = null;
let testClient = null;

/**
 * Connect to test database
 */
async function connectTestDb() {
  try {
    testClient = await MongoClient.connect(TEST_DB_URL);
    testDb = testClient.db(TEST_DB_NAME);
    console.log('Connected to test database');
    return testDb;
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
}

/**
 * Clean up test database
 */
async function cleanupTestDb() {
  if (testDb) {
    try {
      // Drop all collections to ensure clean state
      const collections = await testDb.listCollections().toArray();
      for (const collection of collections) {
        try {
          await testDb.collection(collection.name).drop();
        } catch (error) {
          // Ignore errors if collection doesn't exist
          if (error.code !== 26) { // NamespaceNotFound
            console.error(`Error dropping collection ${collection.name}:`, error);
          }
        }
      }
      console.log('Test database cleaned up');
    } catch (error) {
      console.error('Error cleaning up test database:', error);
    }
  }
}

/**
 * Reset test data to initial state (for when data already exists)
 */
async function resetTestData() {
  if (!testDb) {
    throw new Error('Test database not connected');
  }

  // Reset test users to initial state
  await testDb.collection('users').updateOne(
    { _id: 'test_user_001' },
    { $set: { 
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpass123',
      role: 'user',
      groups: [],
      isActive: true
    }}
  );

  await testDb.collection('users').updateOne(
    { _id: 'test_admin_001' },
    { $set: { 
      username: 'testadmin',
      email: 'admin@example.com',
      password: 'adminpass123',
      role: 'superAdmin',
      groups: [],
      isActive: true
    }}
  );

  // Reset test group to initial state
  await testDb.collection('groups').updateOne(
    { _id: 'test_group_001' },
    { $set: {
      name: 'Test Group',
      description: 'Group for testing',
      createdBy: 'test_admin_001',
      admins: ['test_admin_001'],
      members: ['test_admin_001', 'test_user_001'],
      channels: ['test_channel_001'],
      isActive: true
    }}
  );

  // Reset test channel to initial state
  await testDb.collection('channels').updateOne(
    { _id: 'test_channel_001' },
    { $set: {
      name: 'test-channel',
      description: 'Channel for testing',
      groupId: 'test_group_001',
      createdBy: 'test_admin_001',
      members: ['test_admin_001', 'test_user_001'],
      isActive: true
    }}
  );

  // Remove any dynamically created test data (users, groups, channels with generated IDs)
  await testDb.collection('users').deleteMany({ 
    _id: { $regex: /^user_\d+_\d+$/ }
  });
  
  await testDb.collection('groups').deleteMany({ 
    _id: { $regex: /^group_\d+_\d+$/ }
  });
  
  await testDb.collection('channels').deleteMany({ 
    _id: { $regex: /^channel_\d+_\d+$/ }
  });

  await testDb.collection('messages').deleteMany({ 
    _id: { $regex: /^msg_\d+_\d+$/ }
  });

  console.log('Test data reset to initial state');
}

/**
 * Close test database connection (without cleanup - leaves data for inspection)
 */
async function closeTestDbOnly() {
  if (testClient) {
    await testClient.close();
    testClient = null;
    testDb = null;
    console.log('Test database connection closed (data preserved for inspection)');
  }
}

/**
 * Close test database connection
 */
async function closeTestDb() {
  if (testClient) {
    await testClient.close();
    testClient = null;
    testDb = null;
    console.log('Test database connection closed');
  }
}

/**
 * Create test data
 */
async function createTestData() {
  if (!testDb) {
    throw new Error('Test database not connected');
  }

  // Check if test data already exists
  const existingUser = await testDb.collection('users').findOne({ _id: 'test_user_001' });
  if (existingUser) {
    console.log('Test data already exists, resetting to initial state');
    // Reset the test data to ensure consistent state
    await resetTestData();
    return;
  }

  // Create test user
  const testUser = {
    _id: 'test_user_001',
    username: 'testuser',
    email: 'test@example.com',
    password: 'testpass123',
    role: 'user',
    groups: [],
    createdAt: new Date(),
    isActive: true
  };

  // Create test admin user
  const testAdmin = {
    _id: 'test_admin_001',
    username: 'testadmin',
    email: 'admin@example.com',
    password: 'adminpass123',
    role: 'superAdmin',
    groups: [],
    createdAt: new Date(),
    isActive: true
  };

  // Create test group
  const testGroup = {
    _id: 'test_group_001',
    name: 'Test Group',
    description: 'Group for testing',
    createdBy: 'test_admin_001',
    admins: ['test_admin_001'],
    members: ['test_admin_001', 'test_user_001'],
    channels: ['test_channel_001'],
    createdAt: new Date(),
    isActive: true
  };

  // Create test channel
  const testChannel = {
    _id: 'test_channel_001',
    name: 'test-channel',
    description: 'Channel for testing',
    groupId: 'test_group_001',
    createdBy: 'test_admin_001',
    members: ['test_admin_001', 'test_user_001'],
    createdAt: new Date(),
    isActive: true
  };

  // Create test message
  const testMessage = {
    _id: 'test_message_001',
    channelId: 'test_channel_001',
    userId: 'test_user_001',
    username: 'testuser',
    content: 'Test message content',
    type: 'text',
    timestamp: new Date()
  };

  // Insert test data
  await testDb.collection('users').insertMany([testUser, testAdmin]);
  await testDb.collection('groups').insertOne(testGroup);
  await testDb.collection('channels').insertOne(testChannel);
  await testDb.collection('messages').insertOne(testMessage);

  console.log('Test data created');
}

module.exports = {
  connectTestDb,
  cleanupTestDb,
  closeTestDb,
  closeTestDbOnly,
  createTestData,
  resetTestData,
  getTestDb: () => testDb
};
