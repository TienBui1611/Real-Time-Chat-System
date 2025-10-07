const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const { connectTestDb, cleanupTestDb, closeTestDbOnly, createTestData } = require('./setup');

// Use chai-http plugin
chai.use(chaiHttp);

describe('Channel Routes', function() {
  let testDb;
  let app;
  let adminToken;
  let userToken;
  let groupAdminToken;
  let testGroupId;
  let testChannelId;

  before(async function() {
    this.timeout(10000);
    testDb = await connectTestDb();
    
    // Import and set up the test server with database injection
    const { app: testApp, injectTestDatabase } = require('./testServer');
    app = testApp;
    
    // Inject test database before any requests
    injectTestDatabase(testDb);
    
    await createTestData();

    // Get admin token (superAdmin)
    const adminRes = await chai.request(app)
      .post('/api/auth/login')
      .send({
        username: 'testadmin',
        password: 'adminpass123'
      });
    adminToken = adminRes.body.token;

    // Get regular user token
    const userRes = await chai.request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'testpass123'
      });
    userToken = userRes.body.token;

    // Create a group admin user and get token
    await chai.request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'channelgroupadmin',
        email: 'channelgroupadmin@example.com',
        password: 'channelpass123',
        role: 'groupAdmin'
      });

    const groupAdminRes = await chai.request(app)
      .post('/api/auth/login')
      .send({
        username: 'channelgroupadmin',
        password: 'channelpass123'
      });
    groupAdminToken = groupAdminRes.body.token;

    // Create a test group for channel tests
    const groupRes = await chai.request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${groupAdminToken}`)
      .send({
        name: 'Channel Test Group',
        description: 'Group for testing channels'
      });
    testGroupId = groupRes.body.group.id;
  });

  after(async function() {
    await closeTestDbOnly(); // Keep data for inspection in MongoDB Compass
  });

  describe('GET /api/channels/group/:groupId', function() {
    it('should get channels in group for group member', function(done) {
      chai.request(app)
        .get(`/api/channels/group/${testGroupId}`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('channels');
          expect(res.body.channels).to.be.an('array');
          done();
        });
    });

    it('should get channels in group for super admin', function(done) {
      chai.request(app)
        .get(`/api/channels/group/${testGroupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('channels');
          expect(res.body.channels).to.be.an('array');
          done();
        });
    });

    it('should fail to get channels for non-existent group', function(done) {
      chai.request(app)
        .get('/api/channels/group/nonexistent_group')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'ACCESS_DENIED');
          done();
        });
    });

    it('should fail for unauthorized user to access group channels', function(done) {
      chai.request(app)
        .get(`/api/channels/group/${testGroupId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'ACCESS_DENIED');
          done();
        });
    });

    it('should fail without authentication', function(done) {
      chai.request(app)
        .get(`/api/channels/group/${testGroupId}`)
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'NO_TOKEN');
          done();
        });
    });
  });

  describe('GET /api/channels/my-channels', function() {
    it('should get current user channels', function(done) {
      chai.request(app)
        .get('/api/channels/my-channels')
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('channels');
          expect(res.body.channels).to.be.an('array');
          done();
        });
    });

    it('should fail without authentication', function(done) {
      chai.request(app)
        .get('/api/channels/my-channels')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'NO_TOKEN');
          done();
        });
    });
  });

  describe('POST /api/channels', function() {
    it('should create new channel as group admin', function(done) {
      chai.request(app)
        .post('/api/channels')
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .send({
          name: 'test-channel',
          description: 'A test channel',
          groupId: testGroupId
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('channel');
          expect(res.body.channel).to.have.property('name', 'test-channel');
          expect(res.body.channel).to.have.property('description', 'A test channel');
          expect(res.body.channel).to.have.property('groupId', testGroupId);
          expect(res.body.channel).to.have.property('id');
          
          // Store channel ID for later tests
          testChannelId = res.body.channel.id;
          done();
        });
    });

    it('should create new channel as super admin', function(done) {
      chai.request(app)
        .post('/api/channels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'admin-test-channel',
          description: 'Admin created channel',
          groupId: testGroupId
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('channel');
          expect(res.body.channel).to.have.property('name', 'admin-test-channel');
          done();
        });
    });

    it('should fail to create channel with duplicate name in same group', function(done) {
      chai.request(app)
        .post('/api/channels')
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .send({
          name: 'test-channel', // Already exists
          description: 'Duplicate channel',
          groupId: testGroupId
        })
        .end((err, res) => {
          expect(res).to.have.status(409);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'CHANNEL_EXISTS');
          done();
        });
    });

    it('should fail to create channel with missing name', function(done) {
      chai.request(app)
        .post('/api/channels')
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .send({
          description: 'Channel without name',
          groupId: testGroupId
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'VALIDATION_ERROR');
          done();
        });
    });

    it('should fail to create channel with missing groupId', function(done) {
      chai.request(app)
        .post('/api/channels')
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .send({
          name: 'orphan-channel',
          description: 'Channel without group'
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'VALIDATION_ERROR');
          done();
        });
    });

    it('should fail to create channel in non-existent group', function(done) {
      chai.request(app)
        .post('/api/channels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'orphan-channel',
          description: 'Channel in non-existent group',
          groupId: 'nonexistent_group'
        })
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'ACCESS_DENIED');
          done();
        });
    });

    it('should fail for unauthorized user to create channel', function(done) {
      chai.request(app)
        .post('/api/channels')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'unauthorized-channel',
          description: 'Should not be created',
          groupId: testGroupId
        })
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'ACCESS_DENIED');
          done();
        });
    });

    it('should fail without authentication', function(done) {
      chai.request(app)
        .post('/api/channels')
        .send({
          name: 'unauthenticated-channel',
          description: 'Should not be created',
          groupId: testGroupId
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'NO_TOKEN');
          done();
        });
    });
  });

  describe('GET /api/channels/:id', function() {
    it('should get specific channel as creator', function(done) {
      chai.request(app)
        .get(`/api/channels/${testChannelId}`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('channel');
          expect(res.body.channel).to.have.property('name', 'test-channel');
          expect(res.body.channel).to.have.property('id', testChannelId);
          done();
        });
    });

    it('should get specific channel as super admin', function(done) {
      chai.request(app)
        .get(`/api/channels/${testChannelId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('channel');
          expect(res.body.channel).to.have.property('name', 'test-channel');
          done();
        });
    });

    it('should fail to get non-existent channel', function(done) {
      chai.request(app)
        .get('/api/channels/nonexistent_channel')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'CHANNEL_NOT_FOUND');
          done();
        });
    });

    it('should fail for unauthorized user to access channel', function(done) {
      chai.request(app)
        .get(`/api/channels/${testChannelId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'ACCESS_DENIED');
          done();
        });
    });
  });

  describe('PUT /api/channels/:id', function() {
    it('should update channel as creator', function(done) {
      chai.request(app)
        .put(`/api/channels/${testChannelId}`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .send({
          name: 'updated-test-channel',
          description: 'Updated description'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('channel');
          expect(res.body.channel).to.have.property('name', 'updated-test-channel');
          expect(res.body.channel).to.have.property('description', 'Updated description');
          done();
        });
    });

    it('should update channel as super admin', function(done) {
      chai.request(app)
        .put(`/api/channels/${testChannelId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Admin updated description'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.channel).to.have.property('description', 'Admin updated description');
          done();
        });
    });

    it('should fail to update non-existent channel', function(done) {
      chai.request(app)
        .put('/api/channels/nonexistent_channel')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name'
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'CHANNEL_NOT_FOUND');
          done();
        });
    });

    it('should fail for unauthorized user to update channel', function(done) {
      chai.request(app)
        .put(`/api/channels/${testChannelId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Unauthorized Update'
        })
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'ACCESS_DENIED');
          done();
        });
    });
  });

  describe('POST /api/channels/:id/join', function() {
    it('should allow user to join channel', function(done) {
      // First add user to the group
      chai.request(app)
        .post(`/api/groups/${testGroupId}/members`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .send({
          userId: 'test_user_001'
        })
        .end(() => {
          // Then join the channel
          chai.request(app)
            .post(`/api/channels/${testChannelId}/join`)
            .set('Authorization', `Bearer ${userToken}`)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body).to.have.property('success', true);
              expect(res.body).to.have.property('message');
              done();
            });
        });
    });

    it('should fail to join non-existent channel', function(done) {
      chai.request(app)
        .post('/api/channels/nonexistent_channel/join')
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'CHANNEL_NOT_FOUND');
          done();
        });
    });
  });

  describe('POST /api/channels/:id/leave', function() {
    it('should allow user to leave channel', function(done) {
      chai.request(app)
        .post(`/api/channels/${testChannelId}/leave`)
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('message');
          done();
        });
    });

    it('should fail to leave non-existent channel', function(done) {
      chai.request(app)
        .post('/api/channels/nonexistent_channel/leave')
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'CHANNEL_NOT_FOUND');
          done();
        });
    });
  });

  describe('POST /api/channels/:id/members', function() {
    it('should add member to channel as creator', function(done) {
      chai.request(app)
        .post(`/api/channels/${testChannelId}/members`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .send({
          userId: 'test_user_001'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('message');
          done();
        });
    });

    it('should fail to add non-existent user to channel', function(done) {
      chai.request(app)
        .post(`/api/channels/${testChannelId}/members`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .send({
          userId: 'nonexistent_user'
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'USER_NOT_FOUND');
          done();
        });
    });

    it('should fail to add member to non-existent channel', function(done) {
      chai.request(app)
        .post('/api/channels/nonexistent_channel/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 'test_user_001'
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'CHANNEL_NOT_FOUND');
          done();
        });
    });
  });

  describe('GET /api/channels/:id/members', function() {
    it('should get channel members as creator', function(done) {
      chai.request(app)
        .get(`/api/channels/${testChannelId}/members`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('members');
          expect(res.body.members).to.be.an('array');
          expect(res.body.members.length).to.be.at.least(1);
          done();
        });
    });

    it('should fail to get members of non-existent channel', function(done) {
      chai.request(app)
        .get('/api/channels/nonexistent_channel/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          // Note: This route might not have error field in response
          done();
        });
    });
  });

  describe('DELETE /api/channels/:id/members/:userId', function() {
    it('should remove member from channel as creator', function(done) {
      chai.request(app)
        .delete(`/api/channels/${testChannelId}/members/test_user_001`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('message');
          done();
        });
    });

    it('should fail to remove member from non-existent channel', function(done) {
      chai.request(app)
        .delete('/api/channels/nonexistent_channel/members/test_user_001')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'CHANNEL_NOT_FOUND');
          done();
        });
    });
  });

  describe('DELETE /api/channels/:id', function() {
    it('should delete channel as creator', function(done) {
      chai.request(app)
        .delete(`/api/channels/${testChannelId}`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('message');
          done();
        });
    });

    it('should fail to delete non-existent channel', function(done) {
      chai.request(app)
        .delete('/api/channels/nonexistent_channel')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'CHANNEL_NOT_FOUND');
          done();
        });
    });

    it('should fail for unauthorized user to delete channel', function(done) {
      // First create a new channel to test deletion permissions
      chai.request(app)
        .post('/api/channels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'admin-only-channel',
          description: 'For deletion permission test',
          groupId: testGroupId
        })
        .end((err, createRes) => {
          const newChannelId = createRes.body.channel.id;
          
          // Try to delete as regular user
          chai.request(app)
            .delete(`/api/channels/${newChannelId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body).to.have.property('success', false);
              expect(res.body).to.have.property('error', 'INSUFFICIENT_PERMISSIONS');
              done();
            });
        });
    });
  });
});
