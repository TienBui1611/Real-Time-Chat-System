const express = require('express');
const router = express.Router();
const { authenticateToken, requireGroupAdmin } = require('../middleware/auth');

// Helper function to check if user has access to group
const checkGroupAccess = async (req, groupId) => {
  const group = await req.mongodb.groups.findOne({ _id: groupId, isActive: true });
  if (!group) return { hasAccess: false, error: 'Group not found' };

  // Super Admin can access all groups
  if (req.user.role === 'superAdmin') return { hasAccess: true, group };

  // Check if user is member, admin, or creator of the group
  const hasAccess = group.members.includes(req.user._id) || 
                   group.admins.includes(req.user._id) || 
                   group.createdBy === req.user._id;

  return { hasAccess, group, error: hasAccess ? null : 'You do not have access to this group' };
};

// Helper function to check if user can manage group
const canManageGroup = (req, group) => {
  return req.user.role === 'superAdmin' || 
         group.createdBy === req.user._id || 
         group.admins.includes(req.user._id);
};

// GET /api/channels/group/:groupId - Get all channels in a specific group
router.get('/group/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check group access
    const { hasAccess, error } = await checkGroupAccess(req, groupId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: error
      });
    }

    const channels = await req.mongodb.channels.find({
      groupId: groupId,
      isActive: true
    }).toArray();

    // Transform _id to id for frontend compatibility
    const channelsWithId = channels.map(channel => ({
      ...channel,
      id: channel._id
    }));

    res.json({
      channels: channelsWithId
    });

  } catch (error) {
    console.error('Get group channels error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve channels'
    });
  }
});

// GET /api/channels/my-channels - Get user's accessible channels
router.get('/my-channels', authenticateToken, async (req, res) => {
  try {
    // Get all groups user has access to
    const userGroups = await req.mongodb.groups.find({
      isActive: true,
      $or: [
        { members: req.user._id },
        { admins: req.user._id },
        { createdBy: req.user._id }
      ]
    }).toArray();

    const groupIds = userGroups.map(g => g._id);

    // Get all channels in those groups
    const channels = await req.mongodb.channels.find({
      groupId: { $in: groupIds },
      isActive: true
    }).toArray();

    // Transform _id to id for frontend compatibility
    const channelsWithId = channels.map(channel => ({
      ...channel,
      id: channel._id
    }));

    res.json({
      channels: channelsWithId
    });

  } catch (error) {
    console.error('Get my channels error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve user channels'
    });
  }
});

// GET /api/channels/:id - Get specific channel details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const channel = await req.mongodb.channels.findOne({ _id: id, isActive: true });

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'CHANNEL_NOT_FOUND',
        message: 'Channel not found'
      });
    }

    // Check group access
    const { hasAccess, error } = await checkGroupAccess(req, channel.groupId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: error
      });
    }

    // Transform _id to id for frontend compatibility
    const channelWithId = {
      ...channel,
      id: channel._id
    };

    res.json({ channel: channelWithId });

  } catch (error) {
    console.error('Get channel by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve channel'
    });
  }
});

// POST /api/channels - Create channel in group
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description = '', groupId } = req.body;

    if (!name || !groupId) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Channel name and group ID are required'
      });
    }

    // Check group access and management permissions
    const { hasAccess, group, error } = await checkGroupAccess(req, groupId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: error
      });
    }

    if (!canManageGroup(req, group)) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to create channels in this group'
      });
    }

    // Check if channel name already exists in this group
    const existingChannel = await req.mongodb.channels.findOne({
      name: name,
      groupId: groupId,
      isActive: true
    });

    if (existingChannel) {
      return res.status(409).json({
        success: false,
        error: 'CHANNEL_EXISTS',
        message: 'Channel name already exists in this group'
      });
    }

    // Create new channel
    const newChannel = {
      _id: req.mongodb.generateId('channel'),
      name,
      description,
      groupId,
      createdBy: req.user._id,
      members: [req.user._id], // Creator is automatically a member
      createdAt: new Date(),
      isActive: true
    };

    await req.mongodb.channels.insertOne(newChannel);

    // Add channel to group's channels array
    await req.mongodb.groups.updateOne(
      { _id: groupId },
      { $push: { channels: newChannel._id } }
    );

    // Transform _id to id for frontend compatibility
    const channelWithId = {
      ...newChannel,
      id: newChannel._id
    };

    res.status(201).json({
      success: true,
      channel: channelWithId
    });

  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to create channel'
    });
  }
});

// PUT /api/channels/:id - Update channel details
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const channel = await req.mongodb.channels.findOne({ _id: id, isActive: true });

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'CHANNEL_NOT_FOUND',
        message: 'Channel not found'
      });
    }

    // Check group access and management permissions
    const { hasAccess, group, error } = await checkGroupAccess(req, channel.groupId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: error
      });
    }

    const canUpdate = req.user.role === 'superAdmin' ||
                     channel.createdBy === req.user._id ||
                     canManageGroup(req, group);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to update this channel'
      });
    }

    const updateData = {};

    // Check if name already exists in this group (exclude current channel)
    if (name && name !== channel.name) {
      const existingChannel = await req.mongodb.channels.findOne({
        name: name,
        groupId: channel.groupId,
        isActive: true,
        _id: { $ne: id }
      });

      if (existingChannel) {
        return res.status(409).json({
          success: false,
          error: 'CHANNEL_NAME_EXISTS',
          message: 'Channel name already exists in this group'
        });
      }
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (Object.keys(updateData).length > 0) {
      await req.mongodb.channels.updateOne(
        { _id: id },
        { $set: updateData }
      );
    }

    // Get updated channel
    const updatedChannel = await req.mongodb.channels.findOne({ _id: id });

    // Transform _id to id for frontend compatibility
    const channelWithId = {
      ...updatedChannel,
      id: updatedChannel._id
    };

    res.json({
      success: true,
      channel: channelWithId
    });

  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to update channel'
    });
  }
});

// DELETE /api/channels/:id - Delete channel
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const channel = await req.mongodb.channels.findOne({ _id: id, isActive: true });

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'CHANNEL_NOT_FOUND',
        message: 'Channel not found'
      });
    }

    // Check group access and management permissions
    const { hasAccess, group, error } = await checkGroupAccess(req, channel.groupId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: error
      });
    }

    const canDelete = req.user.role === 'superAdmin' ||
                     channel.createdBy === req.user._id ||
                     canManageGroup(req, group);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to delete this channel'
      });
    }

    // Soft delete - mark as inactive
    await req.mongodb.channels.updateOne(
      { _id: id },
      { 
        $set: { 
          isActive: false, 
          deletedAt: new Date() 
        } 
      }
    );

    // Remove channel from group's channels array
    await req.mongodb.groups.updateOne(
      { _id: channel.groupId },
      { $pull: { channels: id } }
    );

    res.json({
      success: true,
      message: 'Channel deleted successfully'
    });

  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete channel'
    });
  }
});

// POST /api/channels/:id/join - Join channel
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const channel = await req.mongodb.channels.findOne({ _id: id, isActive: true });

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'CHANNEL_NOT_FOUND',
        message: 'Channel not found'
      });
    }

    // Check group access
    const { hasAccess, error } = await checkGroupAccess(req, channel.groupId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: error
      });
    }

    // Check if user is already a member
    if (channel.members.includes(userId)) {
      return res.status(409).json({
        success: false,
        error: 'ALREADY_MEMBER',
        message: 'You are already a member of this channel'
      });
    }

    // Add user to channel members
    await req.mongodb.channels.updateOne(
      { _id: id },
      { $push: { members: userId } }
    );

    // Emit Socket.io event to notify users in the channel about membership change
    if (req.io) {
      req.io.to(id).emit('channel-member-joined', {
        channelId: id,
        userId: userId,
        username: req.user.username,
        message: `${req.user.username} joined the channel`,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Joined channel successfully'
    });

  } catch (error) {
    console.error('Join channel error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to join channel'
    });
  }
});

// POST /api/channels/:id/leave - Leave channel
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const channel = await req.mongodb.channels.findOne({ _id: id, isActive: true });

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'CHANNEL_NOT_FOUND',
        message: 'Channel not found'
      });
    }

    // Cannot leave if user is the channel creator
    if (channel.createdBy === userId) {
      return res.status(400).json({
        success: false,
        error: 'CANNOT_LEAVE_OWN_CHANNEL',
        message: 'Channel creator cannot leave their own channel'
      });
    }

    // Check if user is actually a member
    if (!channel.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'NOT_A_MEMBER',
        message: 'You are not a member of this channel'
      });
    }

    // Remove user from channel members
    await req.mongodb.channels.updateOne(
      { _id: id },
      { $pull: { members: userId } }
    );

    // Emit Socket.io event to notify users in the channel about membership change
    if (req.io) {
      req.io.to(id).emit('channel-member-left', {
        channelId: id,
        userId: userId,
        username: req.user.username,
        message: `${req.user.username} left the channel`,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Left channel successfully'
    });

  } catch (error) {
    console.error('Leave channel error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to leave channel'
    });
  }
});

// POST /api/channels/:id/members - Add user to channel
router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'User ID is required'
      });
    }

    const channel = await req.mongodb.channels.findOne({ _id: id, isActive: true });

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'CHANNEL_NOT_FOUND',
        message: 'Channel not found'
      });
    }

    // Check group access and management permissions
    const { hasAccess, group, error } = await checkGroupAccess(req, channel.groupId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: error
      });
    }

    const canAddMembers = req.user.role === 'superAdmin' ||
                         channel.createdBy === req.user._id ||
                         canManageGroup(req, group);

    if (!canAddMembers) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to add members to this channel'
      });
    }

    // Check if user exists and is a group member
    const userToAdd = await req.mongodb.users.findOne({ _id: userId, isActive: true });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    if (!group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'USER_NOT_GROUP_MEMBER',
        message: 'User must be a group member to join this channel'
      });
    }

    // Check if user is already a channel member
    if (channel.members.includes(userId)) {
      return res.status(409).json({
        success: false,
        error: 'USER_ALREADY_MEMBER',
        message: 'User is already a member of this channel'
      });
    }

    // Add user to channel members
    await req.mongodb.channels.updateOne(
      { _id: id },
      { $push: { members: userId } }
    );

    // Emit Socket.io event to notify users in the channel
    if (req.io) {
      req.io.to(id).emit('channel-member-joined', {
        channelId: id,
        userId: userId,
        username: userToAdd.username,
        message: `${userToAdd.username} was added to the channel`,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'User added to channel successfully'
    });

  } catch (error) {
    console.error('Add channel member error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to add user to channel'
    });
  }
});

// DELETE /api/channels/:id/members/:userId - Remove user from channel
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { id, userId } = req.params;

    const channel = await req.mongodb.channels.findOne({ _id: id, isActive: true });

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'CHANNEL_NOT_FOUND',
        message: 'Channel not found'
      });
    }

    // Check group access and permissions
    const { hasAccess, group, error } = await checkGroupAccess(req, channel.groupId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: error
      });
    }

    const canRemove = req.user.role === 'superAdmin' ||
                     channel.createdBy === req.user._id ||
                     canManageGroup(req, group) ||
                     req.user._id === userId; // User removing themselves

    if (!canRemove) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to remove this user from the channel'
      });
    }

    // Cannot remove the channel creator
    if (channel.createdBy === userId) {
      return res.status(400).json({
        success: false,
        error: 'CANNOT_REMOVE_CREATOR',
        message: 'Cannot remove the channel creator'
      });
    }

    // Get user info for notification
    const userToRemove = await req.mongodb.users.findOne({ _id: userId, isActive: true });

    // Remove user from channel members
    await req.mongodb.channels.updateOne(
      { _id: id },
      { $pull: { members: userId } }
    );

    // Emit Socket.io event to notify users in the channel
    if (req.io && userToRemove) {
      req.io.to(id).emit('channel-member-left', {
        channelId: id,
        userId: userId,
        username: userToRemove.username,
        message: `${userToRemove.username} was removed from the channel`,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'User removed from channel successfully'
    });

  } catch (error) {
    console.error('Remove channel member error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to remove user from channel'
    });
  }
});

// GET /api/channels/:id/members - Get channel members with basic info (for avatars)
router.get('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the channel
    const channel = await req.mongodb.channels.findOne({ 
      _id: id, 
      isActive: true 
    });
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }
    
    // Check if user is a member of this channel
    if (!channel.members.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this channel'
      });
    }
    
    // Get basic info for all channel members (username, avatarPath only)
    const members = await req.mongodb.users.find({ 
      _id: { $in: channel.members },
      isActive: true 
    }, {
      projection: { 
        username: 1, 
        avatarPath: 1,
        _id: 1
      }
    }).toArray();
    
    // Add id field for frontend compatibility
    const membersWithId = members.map(member => ({
      ...member,
      id: member._id
    }));
    
    res.json({
      success: true,
      members: membersWithId
    });
    
  } catch (error) {
    console.error('Get channel members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get channel members'
    });
  }
});

module.exports = router;