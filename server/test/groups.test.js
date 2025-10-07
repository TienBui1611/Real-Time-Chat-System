const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const { connectTestDb, cleanupTestDb, closeTestDb, createTestData } = require('./setup');

// Use chai-http plugin
chai.use(chaiHttp);

describe('Group Routes', function() {
  let testDb;
  let app;
  let adminToken;
  let userToken;
  let groupAdminToken;
  let testGroupId;

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
        username: 'groupadmin',
        email: 'groupadmin@example.com',
        password: 'grouppass123',
        role: 'groupAdmin'
      });

    const groupAdminRes = await chai.request(app)
      .post('/api/auth/login')
      .send({
        username: 'groupadmin',
        password: 'grouppass123'
      });
    groupAdminToken = groupAdminRes.body.token;
  });

  after(async function() {
    await cleanupTestDb();
    await closeTestDb();
  });

  describe('GET /api/groups', function() {
    it('should get all groups for super admin', function(done) {
      chai.request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('groups');
          expect(res.body.groups).to.be.an('array');
          done();
        });
    });

    it('should get user-accessible groups for regular user', function(done) {
      chai.request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('groups');
          expect(res.body.groups).to.be.an('array');
          done();
        });
    });

    it('should fail without authentication', function(done) {
      chai.request(app)
        .get('/api/groups')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'NO_TOKEN');
          done();
        });
    });
  });

  describe('GET /api/groups/my-groups', function() {
    it('should get current user groups', function(done) {
      chai.request(app)
        .get('/api/groups/my-groups')
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('groups');
          expect(res.body.groups).to.be.an('array');
          done();
        });
    });

    it('should fail without authentication', function(done) {
      chai.request(app)
        .get('/api/groups/my-groups')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'NO_TOKEN');
          done();
        });
    });
  });

  describe('POST /api/groups', function() {
    it('should create new group as group admin', function(done) {
      chai.request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .send({
          name: 'New Test Group',
          description: 'A test group for testing'
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('group');
          expect(res.body.group).to.have.property('name', 'New Test Group');
          expect(res.body.group).to.have.property('description', 'A test group for testing');
          expect(res.body.group).to.have.property('id');
          
          // Store group ID for later tests
          testGroupId = res.body.group.id;
          done();
        });
    });

    it('should create new group as super admin', function(done) {
      chai.request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Test Group',
          description: 'A test group created by admin'
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('group');
          expect(res.body.group).to.have.property('name', 'Admin Test Group');
          done();
        });
    });

    it('should fail to create group with duplicate name', function(done) {
      chai.request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .send({
          name: 'New Test Group', // Already exists
          description: 'Duplicate group'
        })
        .end((err, res) => {
          expect(res).to.have.status(409);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'GROUP_EXISTS');
          done();
        });
    });

    it('should fail to create group with missing name', function(done) {
      chai.request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .send({
          description: 'Group without name'
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'VALIDATION_ERROR');
          done();
        });
    });

    it('should fail for regular user to create group', function(done) {
      chai.request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Unauthorized Group',
          description: 'Should not be created'
        })
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'INSUFFICIENT_PERMISSIONS');
          done();
        });
    });

    it('should fail without authentication', function(done) {
      chai.request(app)
        .post('/api/groups')
        .send({
          name: 'Unauthenticated Group',
          description: 'Should not be created'
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'NO_TOKEN');
          done();
        });
    });
  });

  describe('GET /api/groups/:id', function() {
    it('should get specific group as creator', function(done) {
      chai.request(app)
        .get(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('group');
          expect(res.body.group).to.have.property('name', 'New Test Group');
          expect(res.body.group).to.have.property('id', testGroupId);
          done();
        });
    });

    it('should get specific group as super admin', function(done) {
      chai.request(app)
        .get(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('group');
          expect(res.body.group).to.have.property('name', 'New Test Group');
          done();
        });
    });

    it('should fail to get non-existent group', function(done) {
      chai.request(app)
        .get('/api/groups/nonexistent_group')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'GROUP_NOT_FOUND');
          done();
        });
    });

    it('should fail for unauthorized user to access group', function(done) {
      chai.request(app)
        .get(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'ACCESS_DENIED');
          done();
        });
    });
  });

  describe('GET /api/groups/:id/members', function() {
    it('should get group members as group creator', function(done) {
      chai.request(app)
        .get(`/api/groups/${testGroupId}/members`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('members');
          expect(res.body.members).to.be.an('array');
          expect(res.body.members.length).to.be.at.least(1);
          done();
        });
    });

    it('should fail to get members of non-existent group', function(done) {
      chai.request(app)
        .get('/api/groups/nonexistent_group/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'GROUP_NOT_FOUND');
          done();
        });
    });
  });

  describe('PUT /api/groups/:id', function() {
    it('should update group as creator', function(done) {
      chai.request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .send({
          name: 'Updated Test Group',
          description: 'Updated description'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('group');
          expect(res.body.group).to.have.property('name', 'Updated Test Group');
          expect(res.body.group).to.have.property('description', 'Updated description');
          done();
        });
    });

    it('should update group as super admin', function(done) {
      chai.request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Admin updated description'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.group).to.have.property('description', 'Admin updated description');
          done();
        });
    });

    it('should fail to update non-existent group', function(done) {
      chai.request(app)
        .put('/api/groups/nonexistent_group')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name'
        })
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'GROUP_NOT_FOUND');
          done();
        });
    });

    it('should fail for unauthorized user to update group', function(done) {
      chai.request(app)
        .put(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Unauthorized Update'
        })
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'INSUFFICIENT_PERMISSIONS');
          done();
        });
    });
  });

  describe('POST /api/groups/:id/members', function() {
    it('should add member to group as creator', function(done) {
      chai.request(app)
        .post(`/api/groups/${testGroupId}/members`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .send({
          userId: 'test_user_001' // testuser
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('message');
          done();
        });
    });

    it('should fail to add non-existent user to group', function(done) {
      chai.request(app)
        .post(`/api/groups/${testGroupId}/members`)
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
  });

  describe('POST /api/groups/:id/leave', function() {
    it('should allow user to leave group', function(done) {
      chai.request(app)
        .post(`/api/groups/${testGroupId}/leave`)
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('message');
          done();
        });
    });

    it('should fail to leave non-existent group', function(done) {
      chai.request(app)
        .post('/api/groups/nonexistent_group/leave')
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'GROUP_NOT_FOUND');
          done();
        });
    });
  });

  describe('DELETE /api/groups/:id/members/:userId', function() {
    // Add user back first for removal test
    before(function(done) {
      chai.request(app)
        .post(`/api/groups/${testGroupId}/members`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .send({
          userId: 'test_user_001'
        })
        .end(() => done());
    });

    it('should remove member from group as creator', function(done) {
      chai.request(app)
        .delete(`/api/groups/${testGroupId}/members/test_user_001`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('message');
          done();
        });
    });

    it('should fail to remove member from non-existent group', function(done) {
      chai.request(app)
        .delete('/api/groups/nonexistent_group/members/test_user_001')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'GROUP_NOT_FOUND');
          done();
        });
    });
  });

  describe('DELETE /api/groups/:id', function() {
    it('should delete group as creator', function(done) {
      chai.request(app)
        .delete(`/api/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${groupAdminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('message');
          done();
        });
    });

    it('should fail to delete non-existent group', function(done) {
      chai.request(app)
        .delete('/api/groups/nonexistent_group')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'GROUP_NOT_FOUND');
          done();
        });
    });

    it('should fail for unauthorized user to delete group', function(done) {
      // First create a new group to test deletion permissions
      chai.request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Only Group',
          description: 'For deletion permission test'
        })
        .end((err, createRes) => {
          const newGroupId = createRes.body.group.id;
          
          // Try to delete as regular user
          chai.request(app)
            .delete(`/api/groups/${newGroupId}`)
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
