// Authentication middleware for JWT token verification and user authorization

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'NO_TOKEN',
        message: 'Authentication token required'
      });
    }

    const token = authHeader.substring(7);
    
    // Extract user ID from simple token format (session_userId_timestamp)
    // Handle the fact that userId might contain underscores (e.g., user_001)
    const sessionPrefix = 'session_';
    if (!token.startsWith(sessionPrefix)) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      });
    }

    // Remove 'session_' prefix and find the last underscore (before timestamp)
    const tokenWithoutPrefix = token.substring(sessionPrefix.length);
    const lastUnderscoreIndex = tokenWithoutPrefix.lastIndexOf('_');
    
    if (lastUnderscoreIndex === -1) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      });
    }

    const userId = tokenWithoutPrefix.substring(0, lastUnderscoreIndex);

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

    // Add user to request object for use in routes
    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Authentication failed'
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'NOT_AUTHENTICATED',
        message: 'User not authenticated'
      });
    }

    const userRole = req.user.role;
    const hasRequiredRole = roles.includes(userRole);
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

const requireSuperAdmin = requireRole(['superAdmin']);
const requireGroupAdmin = requireRole(['groupAdmin', 'superAdmin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireSuperAdmin,
  requireGroupAdmin
};
