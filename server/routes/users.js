const express = require('express');
const router = express.Router();

// GET /api/users - Get all users (Super Admin only)
router.get('/', async (req, res) => {
  try {
    // TODO: Add authentication and authorization middleware
    const usersData = await req.fileStorage.getUsers();
    if (!usersData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access user data'
      });
    }

    // Remove passwords from response
    const usersWithoutPasswords = usersData.users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      users: usersWithoutPasswords
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve users'
    });
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const { username, email, password, roles = ['user'] } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Username, email, and password are required'
      });
    }

    const usersData = await req.fileStorage.getUsers();
    if (!usersData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access user data'
      });
    }

    // Check if username or email already exists
    const existingUser = usersData.users.find(u => 
      u.username === username || u.email === email
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'USER_EXISTS',
        message: 'Username or email already exists'
      });
    }

    // Create new user
    const newUser = {
      id: req.fileStorage.generateId('user'),
      username,
      email,
      password, // Plain text for Phase 1
      roles,
      groups: [],
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    };

    usersData.users.push(newUser);
    usersData.metadata.totalUsers = usersData.users.length;
    usersData.metadata.nextId = req.fileStorage.generateId('user');

    await req.fileStorage.saveUsers(usersData);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to create user'
    });
  }
});

// TODO: Implement other user routes (GET /:id, PUT /:id, DELETE /:id, PUT /:id/promote)

module.exports = router;
