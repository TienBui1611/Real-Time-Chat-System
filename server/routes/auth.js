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

    // Get users from storage
    const usersData = await req.fileStorage.getUsers();
    if (!usersData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access user data'
      });
    }

    // Find user by username
    const user = usersData.users.find(u => u.username === username && u.isActive);
    
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password'
      });
    }

    // Update last login time
    user.lastLogin = new Date().toISOString();
    await req.fileStorage.saveUsers(usersData);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword,
      token: `session_${user.id}_${Date.now()}`, // Simple token for Phase 1
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

    // Get user from storage
    const usersData = await req.fileStorage.getUsers();
    if (!usersData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access user data'
      });
    }

    const user = usersData.users.find(u => u.id === userId && u.isActive);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found or inactive'
      });
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword
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
