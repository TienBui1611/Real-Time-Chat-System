const express = require('express');
const router = express.Router();

// GET /api/groups - Get all groups (filtered by user permissions)
router.get('/', async (req, res) => {
  try {
    // TODO: Add authentication and authorization middleware
    const groupsData = await req.fileStorage.getGroups();
    if (!groupsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access group data'
      });
    }

    res.json({
      groups: groupsData.groups.filter(group => group.isActive)
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve groups'
    });
  }
});

// POST /api/groups - Create new group (Group Admin+ only)
router.post('/', async (req, res) => {
  try {
    const { name, description = '' } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Group name is required'
      });
    }

    // TODO: Get current user from authentication
    const createdBy = 'user_001'; // Placeholder for now

    const groupsData = await req.fileStorage.getGroups();
    if (!groupsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access group data'
      });
    }

    // Check if group name already exists
    const existingGroup = groupsData.groups.find(g => 
      g.name === name && g.isActive
    );

    if (existingGroup) {
      return res.status(409).json({
        success: false,
        error: 'GROUP_EXISTS',
        message: 'Group name already exists'
      });
    }

    // Create new group
    const newGroup = {
      id: req.fileStorage.generateId('group'),
      name,
      description,
      createdBy,
      admins: [createdBy],
      members: [createdBy],
      channels: [],
      createdAt: new Date().toISOString(),
      isActive: true
    };

    groupsData.groups.push(newGroup);
    groupsData.metadata.totalGroups = groupsData.groups.length;
    groupsData.metadata.nextId = req.fileStorage.generateId('group');

    await req.fileStorage.saveGroups(groupsData);

    res.status(201).json({
      success: true,
      group: newGroup
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to create group'
    });
  }
});

// TODO: Implement other group routes

module.exports = router;
