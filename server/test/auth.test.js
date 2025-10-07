const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const { connectTestDb, cleanupTestDb, closeTestDb, createTestData } = require('./setup');

// Use chai-http plugin
chai.use(chaiHttp);

describe('Authentication Routes', function() {
  let testDb;
  let app;

  before(async function() {
    this.timeout(10000);
    testDb = await connectTestDb();
    
    // Import and set up the test server with database injection
    const { app: testApp, injectTestDatabase } = require('./testServer');
    app = testApp;
    
    // Inject test database before any requests
    injectTestDatabase(testDb);
    
    await createTestData();
  });

  after(async function() {
    await cleanupTestDb();
    await closeTestDb();
  });

  describe('POST /api/auth/login', function() {
    it('should login with valid credentials', function(done) {
      chai.request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('user');
          expect(res.body).to.have.property('token');
          expect(res.body.user).to.have.property('username', 'testuser');
          expect(res.body.user).to.have.property('role', 'user');
          done();
        });
    });

    it('should fail login with invalid username', function(done) {
      chai.request(app)
        .post('/api/auth/login')
        .send({
          username: 'invaliduser',
          password: 'testpass123'
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'INVALID_CREDENTIALS');
          done();
        });
    });

    it('should fail login with invalid password', function(done) {
      chai.request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'INVALID_CREDENTIALS');
          done();
        });
    });

    it('should fail login with missing username', function(done) {
      chai.request(app)
        .post('/api/auth/login')
        .send({
          password: 'testpass123'
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'MISSING_FIELDS');
          done();
        });
    });

    it('should fail login with missing password', function(done) {
      chai.request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser'
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'MISSING_FIELDS');
          done();
        });
    });

    it('should login admin user with correct role', function(done) {
      chai.request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'adminpass123'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.user).to.have.property('role', 'superAdmin');
          done();
        });
    });
  });

  describe('GET /api/auth/current', function() {
    let userToken;
    let adminToken;

    before(function(done) {
      // Get user token
      chai.request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123'
        })
        .end((err, res) => {
          userToken = res.body.token;
          
          // Get admin token
          chai.request(app)
            .post('/api/auth/login')
            .send({
              username: 'testadmin',
              password: 'adminpass123'
            })
            .end((err, res) => {
              adminToken = res.body.token;
              done();
            });
        });
    });

    it('should return current user with valid token', function(done) {
      chai.request(app)
        .get('/api/auth/current')
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('user');
          expect(res.body.user).to.have.property('username', 'testuser');
          done();
        });
    });

    it('should return admin user with valid admin token', function(done) {
      chai.request(app)
        .get('/api/auth/current')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.user).to.have.property('username', 'testadmin');
          expect(res.body.user).to.have.property('role', 'superAdmin');
          done();
        });
    });

    it('should fail with invalid token', function(done) {
      chai.request(app)
        .get('/api/auth/current')
        .set('Authorization', 'Bearer invalid_token')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'INVALID_TOKEN');
          done();
        });
    });

    it('should fail with malformed token (no underscores)', function(done) {
      chai.request(app)
        .get('/api/auth/current')
        .set('Authorization', 'Bearer session_malformed')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'INVALID_TOKEN');
          done();
        });
    });

    it('should fail with valid token format but non-existent user', function(done) {
      chai.request(app)
        .get('/api/auth/current')
        .set('Authorization', 'Bearer session_nonexistent_user_123456')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'USER_NOT_FOUND');
          done();
        });
    });

    it('should fail with missing token', function(done) {
      chai.request(app)
        .get('/api/auth/current')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'NO_TOKEN');
          done();
        });
    });
  });

  describe('POST /api/auth/logout', function() {
    let userToken;

    before(function(done) {
      chai.request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123'
        })
        .end((err, res) => {
          userToken = res.body.token;
          done();
        });
    });

    it('should logout successfully with valid token', function(done) {
      chai.request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('message', 'Logged out successfully');
          done();
        });
    });

    it('should fail logout with missing token', function(done) {
      chai.request(app)
        .post('/api/auth/logout')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('error', 'NO_TOKEN');
          done();
        });
    });
  });
});