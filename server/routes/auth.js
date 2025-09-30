const express = require('express');
const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Username and password are required'
      });
    }

    // Find user by username in MongoDB
    const user = await req.mongodb.users.findOne({
      username: username,
      password: password,
      isActive: true
    });
    
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password'
      });
    }

    // Update last login time
    await req.mongodb.users.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Return user data (without password) and add id field for frontend compatibility
    const { password: _, ...userWithoutPassword } = user;
    const userWithId = {
      ...userWithoutPassword,
      id: user._id
    };
    
    res.json({
      success: true,
      user: userWithId,
      token: `session_${user._id}_${Date.now()}`, // Simple token for Phase 1
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Login failed due to internal error'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // For Phase 1, we just return success
  // In Phase 2, we would invalidate the session/token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// GET /api/auth/current
router.get('/current', async (req, res) => {
  try {
    // For Phase 1, we'll implement basic token checking
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'NO_TOKEN',
        message: 'Authentication token required'
      });
    }

    const token = authHeader.substring(7);
    // Extract user ID from simple token format
    const tokenParts = token.split('_');
    if (tokenParts.length < 2) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      });
    }

    const userId = tokenParts[1];

    // Get user from MongoDB
    const user = await req.mongodb.users.findOne({
      _id: userId,
      isActive: true
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found or inactive'
      });
    }

    // Return user data (without password) and add id field for frontend compatibility
    const { password: _, ...userWithoutPassword } = user;
    const userWithId = {
      ...userWithoutPassword,
      id: user._id
    };
    
    res.json({
      user: userWithId
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to get current user'
    });
  }
});

module.exports = router;
