const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for different upload types
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/avatars');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp.extension
    const uniqueName = `${req.user._id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const chatImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/chat-images');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: channelId_userId_timestamp.extension
    const channelId = req.body.channelId || 'unknown';
    const uniqueName = `${channelId}_${req.user._id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for images only
const imageFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

// Create multer instances for different upload types
const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
    files: 1
  }
});

const chatImageUpload = multer({
  storage: chatImageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for chat images
    files: 1
  }
});

// POST /api/upload/avatar - Upload user avatar
router.post('/avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'NO_FILE_UPLOADED',
        message: 'No avatar file was uploaded'
      });
    }

    // Generate the avatar URL path
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    
    // Update user's avatar path in MongoDB
    const updateResult = await req.mongodb.users.updateOne(
      { _id: req.user._id },
      { 
        $set: { 
          avatarPath: avatarPath,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      // Clean up uploaded file if user update failed
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarPath: avatarPath,
      fileInfo: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });

    console.log(`🖼️ Avatar uploaded by ${req.user.username}: ${avatarPath}`);

  } catch (error) {
    console.error('Avatar upload error:', error);
    
    // Clean up uploaded file if database update failed
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'UPLOAD_FAILED',
      message: 'Failed to upload avatar'
    });
  }
});

// DELETE /api/upload/avatar - Remove user avatar
router.delete('/avatar', authenticateToken, async (req, res) => {
  try {
    // Get current user's avatar path
    const user = await req.mongodb.users.findOne({ _id: req.user._id });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    const oldAvatarPath = user.avatarPath;

    // Remove avatar path from user document
    const updateResult = await req.mongodb.users.updateOne(
      { _id: req.user._id },
      { 
        $unset: { avatarPath: "" },
        $set: { updatedAt: new Date() }
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Delete the physical file if it exists
    if (oldAvatarPath) {
      const filename = path.basename(oldAvatarPath);
      const filePath = path.join(__dirname, '../uploads/avatars', filename);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted avatar file: ${filename}`);
        } catch (fileError) {
          console.error('Error deleting avatar file:', fileError);
          // Don't fail the request if file deletion fails
        }
      }
    }

    res.json({
      success: true,
      message: 'Avatar removed successfully'
    });

    console.log(`🗑️ Avatar removed for user: ${req.user.username}`);

  } catch (error) {
    console.error('Avatar removal error:', error);
    res.status(500).json({
      success: false,
      error: 'REMOVAL_FAILED',
      message: 'Failed to remove avatar'
    });
  }
});

// POST /api/upload/chat-image - Upload chat image
router.post('/chat-image', authenticateToken, chatImageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'NO_FILE_UPLOADED',
        message: 'No image file was uploaded'
      });
    }

    const { channelId } = req.body;
    
    if (!channelId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CHANNEL_ID',
        message: 'Channel ID is required'
      });
    }

    // Verify user has access to the channel
    const channel = await req.mongodb.channels.findOne({ 
      _id: channelId, 
      isActive: true,
      members: req.user._id 
    });

    if (!channel) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'You are not a member of this channel'
      });
    }

    // Generate the image URL path
    const imagePath = `/uploads/chat-images/${req.file.filename}`;
    
    // Generate unique ID for the message
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    const messageId = `msg_${timestamp}_${randomNum}`;

    // Create image message in MongoDB
    const imageMessage = {
      _id: messageId,
      channelId: channelId,
      userId: req.user._id,
      username: req.user.username,
      content: imagePath, // Store the image path as content
      type: 'image',
      timestamp: new Date()
    };

    await req.mongodb.messages.insertOne(imageMessage);

    // Add id field for frontend compatibility
    const messageWithId = {
      ...imageMessage,
      id: imageMessage._id
    };

    // Broadcast image message to all users in the channel via Socket.io
    if (req.io) {
      req.io.to(channelId).emit('message', messageWithId);
    }

    res.json({
      success: true,
      message: 'Image uploaded and sent successfully',
      imageMessage: messageWithId,
      fileInfo: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });

    console.log(`🖼️ Chat image uploaded by ${req.user.username} in channel ${channelId}: ${imagePath}`);

  } catch (error) {
    console.error('Chat image upload error:', error);
    
    // Clean up uploaded file if database update failed
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'UPLOAD_FAILED',
      message: 'Failed to upload chat image'
    });
  }
});

// GET /uploads/* - Serve uploaded files
router.get('/avatars/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/avatars', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({
      success: false,
      error: 'FILE_NOT_FOUND',
      message: 'Avatar not found'
    });
  }
});

router.get('/chat-images/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/chat-images', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({
      success: false,
      error: 'FILE_NOT_FOUND',
      message: 'Chat image not found'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'FILE_TOO_LARGE',
        message: 'File size exceeds the allowed limit'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'TOO_MANY_FILES',
        message: 'Too many files uploaded'
      });
    }
  }
  
  if (error.message.includes('Only image files')) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_FILE_TYPE',
      message: error.message
    });
  }

  next(error);
});

module.exports = router;
