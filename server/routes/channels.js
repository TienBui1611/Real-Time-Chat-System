const express = require('express');
const router = express.Router();
const { authenticateToken, requireGroupAdmin } = require('../middleware/auth');

// Helper function to check if user has access to group
const checkGroupAccess = async (req, groupId) => {
  const groupsData = await req.fileStorage.getGroups();
  if (!groupsData) return { hasAccess: false, error: 'Failed to access group data' };

  const group = groupsData.groups.find(g => g.id === groupId && g.isActive);
  if (!group) return { hasAccess: false, error: 'Group not found' };

  // Super Admin can access all groups
  if (req.user.role === 'superAdmin') return { hasAccess: true, group };

  // Check if user is member, admin, or creator of the group
  const hasAccess = group.members.includes(req.user.id) || 
                   group.admins.includes(req.user.id) || 
                   group.createdBy === req.user.id;

  return { hasAccess, group, error: hasAccess ? null : 'You do not have access to this group' };
};

// Helper function to check if user can manage group
const canManageGroup = (req, group) => {
  return req.user.role === 'superAdmin' || 
         group.createdBy === req.user.id || 
         group.admins.includes(req.user.id);
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

    const channelsData = await req.fileStorage.getChannels();
    if (!channelsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access channel data'
      });
    }

    // Filter channels by group ID and user access
    const groupChannels = channelsData.channels.filter(channel => {
      if (!channel.isActive || channel.groupId !== groupId) return false;
      
      // Super Admin can see all channels
      if (req.user.role === 'superAdmin') return true;
      
      // Group members can see all channels in the group (since they already have group access)
      // The checkGroupAccess function above already verified they're group members
      return true;
    });

    res.json({
      channels: groupChannels
    });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve channels'
    });
  }
});

// POST /api/channels - Create new channel within a group
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

    // Check if user can manage the group (create channels)
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

    const createdBy = req.user.id;

    const channelsData = await req.fileStorage.getChannels();
    if (!channelsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access channel data'
      });
    }

    // Check if channel name already exists in the group
    const existingChannel = channelsData.channels.find(c => 
      c.name === name && c.groupId === groupId && c.isActive
    );

    if (existingChannel) {
      return res.status(409).json({
        success: false,
        error: 'CHANNEL_EXISTS',
        message: 'Channel name already exists in this group'
      });
    }

    // Create new channel
    const newChannel = {
      id: req.fileStorage.generateId('channel'),
      name,
      description,
      groupId,
      createdBy,
      members: [createdBy],
      createdAt: new Date().toISOString(),
      isActive: true
    };

    channelsData.channels.push(newChannel);
    channelsData.metadata.totalChannels = channelsData.channels.length;
    channelsData.metadata.nextId = req.fileStorage.generateId('channel');

    await req.fileStorage.saveChannels(channelsData);

    // Also add channel to group's channels array
    const groupsData = await req.fileStorage.getGroups();
    if (groupsData) {
      const groupIndex = groupsData.groups.findIndex(g => g.id === groupId);
      if (groupIndex !== -1) {
        groupsData.groups[groupIndex].channels.push(newChannel.id);
        await req.fileStorage.saveGroups(groupsData);
      }
    }

    res.status(201).json({
      success: true,
      channel: newChannel
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

// GET /api/channels/my-channels - Get current user's accessible channels
router.get('/my-channels', authenticateToken, async (req, res) => {
  try {
    const channelsData = await req.fileStorage.getChannels();
    if (!channelsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access channel data'
      });
    }

    const userChannels = channelsData.channels.filter(channel => {
      if (!channel.isActive) return false;
      
      // Super Admin can see all channels
      if (req.user.role === 'superAdmin') return true;
      
      // Users can see channels they are members of or created
      return channel.members.includes(req.user.id) || channel.createdBy === req.user.id;
    });

    res.json({ channels: userChannels });
  } catch (error) {
    console.error('Get user channels error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve user channels'
    });
  }
});

// GET /api/channels/:id - Get specific channel
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const channelsData = await req.fileStorage.getChannels();
    if (!channelsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access channel data'
      });
    }

    const channel = channelsData.channels.find(c => c.id === id && c.isActive);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'CHANNEL_NOT_FOUND',
        message: 'Channel not found'
      });
    }

    // Check if user has access to this channel
    const hasAccess = req.user.role === 'superAdmin' || 
                     channel.members.includes(req.user.id) || 
                     channel.createdBy === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'You do not have access to this channel'
      });
    }

    res.json({ channel });
  } catch (error) {
    console.error('Get channel by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve channel'
    });
  }
});

// POST /api/channels/:id/join - Join channel
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const channelsData = await req.fileStorage.getChannels();
    if (!channelsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access channel data'
      });
    }

    const channelIndex = channelsData.channels.findIndex(c => c.id === id && c.isActive);
    if (channelIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'CHANNEL_NOT_FOUND',
        message: 'Channel not found'
      });
    }

    const channel = channelsData.channels[channelIndex];

    // Check if user has access to the group
    const { hasAccess, group, error } = await checkGroupAccess(req, channel.groupId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: error
      });
    }

    // Check if user is already a member
    if (channel.members.includes(req.user.id) || channel.createdBy === req.user.id) {
      return res.status(409).json({
        success: false,
        error: 'ALREADY_MEMBER',
        message: 'You are already a member of this channel'
      });
    }

    // Add user to channel
    channel.members.push(req.user.id);
    channelsData.channels[channelIndex] = channel;
    await req.fileStorage.saveChannels(channelsData);

    res.json({
      success: true,
      message: 'Successfully joined the channel'
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

// PUT /api/channels/:id - Update channel
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const channelsData = await req.fileStorage.getChannels();
    if (!channelsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access channel data'
      });
    }

    const channelIndex = channelsData.channels.findIndex(c => c.id === id && c.isActive);
    if (channelIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'CHANNEL_NOT_FOUND',
        message: 'Channel not found'
      });
    }

    const channel = channelsData.channels[channelIndex];

    // Check if user can manage the group this channel belongs to
    const { hasAccess, group, error } = await checkGroupAccess(req, channel.groupId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: error
      });
    }

    // Check permissions - only group managers or channel creator can update
    const canUpdate = req.user.role === 'superAdmin' || 
                     channel.createdBy === req.user.id || 
                     canManageGroup(req, group);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to update this channel'
      });
    }

    // Update channel fields
    if (name && name !== channel.name) {
      // Check if new name already exists in the group
      const existingChannel = channelsData.channels.find(c => 
        c.name === name && c.groupId === channel.groupId && c.isActive && c.id !== id
      );
      if (existingChannel) {
        return res.status(409).json({
          success: false,
          error: 'CHANNEL_NAME_EXISTS',
          message: 'Channel name already exists in this group'
        });
      }
      channel.name = name;
    }

    if (description !== undefined) {
      channel.description = description;
    }

    channelsData.channels[channelIndex] = channel;
    await req.fileStorage.saveChannels(channelsData);

    res.json({
      success: true,
      channel: channel
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
    
    const channelsData = await req.fileStorage.getChannels();
    if (!channelsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access channel data'
      });
    }

    const channelIndex = channelsData.channels.findIndex(c => c.id === id && c.isActive);
    if (channelIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'CHANNEL_NOT_FOUND',
        message: 'Channel not found'
      });
    }

    const channel = channelsData.channels[channelIndex];

    // Check if user can manage the group this channel belongs to
    const { hasAccess, group, error } = await checkGroupAccess(req, channel.groupId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: error
      });
    }

    // Check permissions - only group managers or channel creator can delete
    const canDelete = req.user.role === 'superAdmin' || 
                     channel.createdBy === req.user.id || 
                     canManageGroup(req, group);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to delete this channel'
      });
    }

    // Soft delete - mark as inactive
    channel.isActive = false;
    channelsData.channels[channelIndex] = channel;
    await req.fileStorage.saveChannels(channelsData);

    // Remove channel from group's channels array
    const groupsData = await req.fileStorage.getGroups();
    if (groupsData) {
      const groupIndex = groupsData.groups.findIndex(g => g.id === channel.groupId);
      if (groupIndex !== -1) {
        groupsData.groups[groupIndex].channels = groupsData.groups[groupIndex].channels.filter(
          channelId => channelId !== id
        );
        await req.fileStorage.saveGroups(groupsData);
      }
    }

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

// POST /api/channels/:id/leave - Leave channel
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const channelsData = await req.fileStorage.getChannels();
    if (!channelsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access channel data'
      });
    }

    const channelIndex = channelsData.channels.findIndex(c => c.id === id && c.isActive);
    if (channelIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'CHANNEL_NOT_FOUND',
        message: 'Channel not found'
      });
    }

    const channel = channelsData.channels[channelIndex];

    // Cannot leave if user is the creator
    if (channel.createdBy === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'CANNOT_LEAVE_OWN_CHANNEL',
        message: 'Channel creators cannot leave their own channel. Delete the channel instead.'
      });
    }

    // Remove user from channel
    channel.members = channel.members.filter(memberId => memberId !== req.user.id);
    channelsData.channels[channelIndex] = channel;
    await req.fileStorage.saveChannels(channelsData);

    res.json({
      success: true,
      message: 'Successfully left the channel'
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

// POST /api/channels/:id/members - Add user to channel (Group Admin+ only)
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

    const channelsData = await req.fileStorage.getChannels();
    if (!channelsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access channel data'
      });
    }

    const channelIndex = channelsData.channels.findIndex(c => c.id === id && c.isActive);
    if (channelIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'CHANNEL_NOT_FOUND',
        message: 'Channel not found'
      });
    }

    const channel = channelsData.channels[channelIndex];

    // Get group data to check permissions
    const groupsData = await req.fileStorage.getGroups();
    if (!groupsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access group data'
      });
    }

    const group = groupsData.groups.find(g => g.id === channel.groupId && g.isActive);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Parent group not found'
      });
    }

    // Check permissions - only group managers, channel creator, or super admin can add members
    const canAddMembers = req.user.role === 'superAdmin' || 
                         group.createdBy === req.user.id || 
                         group.admins.includes(req.user.id) ||
                         channel.createdBy === req.user.id;

    if (!canAddMembers) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to add members to this channel'
      });
    }

    // Check if user is already a member
    if (channel.members.includes(userId)) {
      return res.status(409).json({
        success: false,
        error: 'USER_ALREADY_MEMBER',
        message: 'User is already a member of this channel'
      });
    }

    // Check if user is a member of the parent group
    const isGroupMember = group.members.includes(userId) || 
                         group.admins.includes(userId) || 
                         group.createdBy === userId;

    if (!isGroupMember) {
      return res.status(400).json({
        success: false,
        error: 'USER_NOT_IN_GROUP',
        message: 'User must be a member of the parent group first'
      });
    }

    // Add user to channel
    channelsData.channels[channelIndex].members.push(userId);
    channelsData.metadata.lastModified = new Date().toISOString();

    await req.fileStorage.saveChannels(channelsData);

    res.json({
      success: true,
      message: 'User added to channel successfully'
    });
  } catch (error) {
    console.error('Add user to channel error:', error);
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

    const channelsData = await req.fileStorage.getChannels();
    if (!channelsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access channel data'
      });
    }

    const channelIndex = channelsData.channels.findIndex(c => c.id === id && c.isActive);
    if (channelIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'CHANNEL_NOT_FOUND',
        message: 'Channel not found'
      });
    }

    const channel = channelsData.channels[channelIndex];

    // Get group data to check permissions
    const groupsData = await req.fileStorage.getGroups();
    if (!groupsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access group data'
      });
    }

    const group = groupsData.groups.find(g => g.id === channel.groupId && g.isActive);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Parent group not found'
      });
    }

    // Check permissions - group managers, channel creator, super admin, or the user themselves can remove
    const canRemoveMembers = req.user.role === 'superAdmin' || 
                            group.createdBy === req.user.id || 
                            group.admins.includes(req.user.id) ||
                            channel.createdBy === req.user.id ||
                            req.user.id === userId; // Users can remove themselves

    if (!canRemoveMembers) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to remove members from this channel'
      });
    }

    // Cannot remove the channel creator
    if (userId === channel.createdBy) {
      return res.status(400).json({
        success: false,
        error: 'CANNOT_REMOVE_CREATOR',
        message: 'Cannot remove the channel creator'
      });
    }

    // Check if user is a member
    if (!channel.members.includes(userId)) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_MEMBER',
        message: 'User is not a member of this channel'
      });
    }

    // Remove user from channel
    channelsData.channels[channelIndex].members = channel.members.filter(id => id !== userId);
    channelsData.metadata.lastModified = new Date().toISOString();

    await req.fileStorage.saveChannels(channelsData);

    res.json({
      success: true,
      message: 'User removed from channel successfully'
    });
  } catch (error) {
    console.error('Remove user from channel error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to remove user from channel'
    });
  }
});

module.exports = router;
