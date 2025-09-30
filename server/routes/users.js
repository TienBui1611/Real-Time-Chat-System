const express = require('express');
const router = express.Router();
const { authenticateToken, requireSuperAdmin, requireGroupAdmin } = require('../middleware/auth');

// GET /api/users - Get all users (Super Admin and Group Admin)
router.get('/', authenticateToken, requireGroupAdmin, async (req, res) => {
  try {
    const users = await req.mongodb.users.find({ isActive: true }).toArray();
    
    // Remove passwords from response and add id field for frontend compatibility
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        id: user._id
      };
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

    // Check if username or email already exists
    const existingUser = await req.mongodb.users.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'USER_EXISTS',
        message: 'Username or email already exists'
      });
    }

    // Create new user
    const newUser = {
      _id: req.mongodb.generateId('user'),
      username,
      email,
      password, // Plain text for Phase 1
      role,
      groups: [],
      createdAt: new Date(),
      lastLogin: null,
      isActive: true
    };

    await req.mongodb.users.insertOne(newUser);

    // Return user without password and add id field for frontend compatibility
    const { password: _, ...userWithoutPassword } = newUser;
    const userWithId = {
      ...userWithoutPassword,
      id: newUser._id
    };
    
    res.status(201).json({
      success: true,
      user: userWithId
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
    const user = await req.mongodb.users.findOne({ _id: id });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Return user without password and add id field for frontend compatibility
    const { password: _, ...userWithoutPassword } = user;
    const userWithId = {
      ...userWithoutPassword,
      id: user._id
    };
    res.json({ user: userWithId });

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
    
    const user = await req.mongodb.users.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    const updateData = {};

    // Check if username already exists (exclude current user)
    if (username && username !== user.username) {
      const existingUser = await req.mongodb.users.findOne({ 
        username: username, 
        _id: { $ne: id } 
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'USERNAME_EXISTS',
          message: 'Username already exists'
        });
      }
      updateData.username = username;
    }

    // Check if email already exists (exclude current user)
    if (email && email !== user.email) {
      const existingUser = await req.mongodb.users.findOne({ 
        email: email, 
        _id: { $ne: id } 
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'EMAIL_EXISTS',
          message: 'Email already exists'
        });
      }
      updateData.email = email;
    }

    if (role && typeof role === 'string') {
      updateData.role = role;
    }

    if (Object.keys(updateData).length > 0) {
      await req.mongodb.users.updateOne(
        { _id: id },
        { $set: updateData }
      );
    }

    // Get updated user
    const updatedUser = await req.mongodb.users.findOne({ _id: id });
    const { password: _, ...userWithoutPassword } = updatedUser;
    const userWithId = {
      ...userWithoutPassword,
      id: updatedUser._id
    };
    
    res.json({
      success: true,
      user: userWithId
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
    if (req.user._id === id) {
      return res.status(400).json({
        success: false,
        error: 'CANNOT_DELETE_SELF',
        message: 'Cannot delete your own account'
      });
    }

    const user = await req.mongodb.users.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Soft delete - mark as inactive
    await req.mongodb.users.updateOne(
      { _id: id },
      { 
        $set: { 
          isActive: false, 
          deletedAt: new Date() 
        } 
      }
    );

    // TODO: Remove user from all groups and channels they belong to

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

    const user = await req.mongodb.users.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    await req.mongodb.users.updateOne(
      { _id: id },
      { $set: { role: role } }
    );

    // Get updated user
    const updatedUser = await req.mongodb.users.findOne({ _id: id });
    const { password: _, ...userWithoutPassword } = updatedUser;
    const userWithId = {
      ...userWithoutPassword,
      id: updatedUser._id
    };
    
    res.json({
      success: true,
      user: userWithId
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

    const existingUser = await req.mongodb.users.findOne({ username: username });
    res.json({ available: !existingUser });

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

    const existingUser = await req.mongodb.users.findOne({ email: email });
    res.json({ available: !existingUser });

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

    const query = q.toLowerCase();
    const users = await req.mongodb.users.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { role: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).toArray();

    // Remove passwords from response and add id field for frontend compatibility
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        id: user._id
      };
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