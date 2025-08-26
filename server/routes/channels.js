const express = require('express');
const router = express.Router();

// GET /api/channels/group/:groupId - Get all channels in a specific group
router.get('/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    const channelsData = await req.fileStorage.getChannels();
    if (!channelsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access channel data'
      });
    }

    // Filter channels by group ID
    const groupChannels = channelsData.channels.filter(
      channel => channel.groupId === groupId && channel.isActive
    );

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
router.post('/', async (req, res) => {
  try {
    const { name, description = '', groupId } = req.body;

    if (!name || !groupId) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Channel name and group ID are required'
      });
    }

    // TODO: Get current user from authentication
    const createdBy = 'user_001'; // Placeholder for now

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

// TODO: Implement other channel routes

module.exports = router;
