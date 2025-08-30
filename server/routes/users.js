const express = require('express');
const router = express.Router();
const { authenticateToken, requireSuperAdmin, requireGroupAdmin } = require('../middleware/auth');

// GET /api/users - Get all users (Super Admin and Group Admin)
router.get('/', authenticateToken, requireGroupAdmin, async (req, res) => {
  try {
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
router.post('/', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

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
      role,  // Changed from roles array to single role
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

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const usersData = await req.fileStorage.getUsers();
    
    if (!usersData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access user data'
      });
    }

    const user = usersData.users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve user'
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role } = req.body;
    
    const usersData = await req.fileStorage.getUsers();
    if (!usersData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access user data'
      });
    }

    const userIndex = usersData.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    const user = usersData.users[userIndex];

    // Check if username or email already exists (exclude current user)
    if (username && username !== user.username) {
      const existingUser = usersData.users.find(u => u.username === username && u.id !== id);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'USERNAME_EXISTS',
          message: 'Username already exists'
        });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingUser = usersData.users.find(u => u.email === email && u.id !== id);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'EMAIL_EXISTS',
          message: 'Email already exists'
        });
      }
      user.email = email;
    }

    if (role && typeof role === 'string') {
      user.role = role;
    }

    usersData.users[userIndex] = user;
    await req.fileStorage.saveUsers(usersData);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to update user'
    });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent users from deleting themselves
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: 'CANNOT_DELETE_SELF',
        message: 'Cannot delete your own account'
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

    const userIndex = usersData.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Remove user from users array
    usersData.users.splice(userIndex, 1);
    usersData.metadata.totalUsers = usersData.users.length;

    // TODO: Remove user from all groups and channels they belong to

    await req.fileStorage.saveUsers(usersData);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete user'
    });
  }
});

// PUT /api/users/:id/promote - Change user role
router.put('/:id/promote', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || typeof role !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Valid role is required'
      });
    }

    const validRoles = ['user', 'groupAdmin', 'superAdmin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ROLE',
        message: `Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}`
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

    const userIndex = usersData.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    usersData.users[userIndex].role = role;
    await req.fileStorage.saveUsers(usersData);

    // Return user without password
    const { password: _, ...userWithoutPassword } = usersData.users[userIndex];
    res.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Promote user error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to promote user'
    });
  }
});

// POST /api/users/validate-username - Check username availability
router.post('/validate-username', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Username is required'
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

    const exists = usersData.users.some(u => u.username === username);
    res.json({ available: !exists });

  } catch (error) {
    console.error('Validate username error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to validate username'
    });
  }
});

// POST /api/users/validate-email - Check email availability
router.post('/validate-email', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Email is required'
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

    const exists = usersData.users.some(u => u.email === email);
    res.json({ available: !exists });

  } catch (error) {
    console.error('Validate email error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to validate email'
    });
  }
});

// GET /api/users/search - Search users
router.get('/search', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Search query is required'
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

    const query = q.toLowerCase();
    const filteredUsers = usersData.users.filter(user =>
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );

    // Remove passwords from response
    const usersWithoutPasswords = filteredUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({ users: usersWithoutPasswords });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to search users'
    });
  }
});

module.exports = router;
