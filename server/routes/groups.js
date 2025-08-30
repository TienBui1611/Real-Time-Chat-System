const express = require('express');
const router = express.Router();
const { authenticateToken, requireGroupAdmin } = require('../middleware/auth');

// GET /api/groups - Get all groups (filtered by user permissions)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const groupsData = await req.fileStorage.getGroups();
    if (!groupsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access group data'
      });
    }

    // Filter groups based on user permissions
    const userGroups = groupsData.groups.filter(group => {
      if (!group.isActive) return false;
      
      // Super Admin can see all groups
      if (req.user.role === 'superAdmin') return true;
      
      // Users can see groups they are members of or created
      return group.members.includes(req.user.id) || 
             group.admins.includes(req.user.id) || 
             group.createdBy === req.user.id;
    });

    res.json({
      groups: userGroups
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
router.post('/', authenticateToken, requireGroupAdmin, async (req, res) => {
  try {
    const { name, description = '' } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Group name is required'
      });
    }

    const createdBy = req.user.id;

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

// GET /api/groups/my-groups - Get current user's groups
router.get('/my-groups', authenticateToken, async (req, res) => {
  try {
    const groupsData = await req.fileStorage.getGroups();
    if (!groupsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access group data'
      });
    }

    const userGroups = groupsData.groups.filter(group => 
      group.isActive && (
        group.members.includes(req.user.id) || 
        group.admins.includes(req.user.id) || 
        group.createdBy === req.user.id
      )
    );

    res.json({ groups: userGroups });
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve user groups'
    });
  }
});

// Test route
router.get('/test-members', (req, res) => {
  res.json({ message: 'Test route works!' });
});

// GET /api/groups/:id/members - Get group members
router.get('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const groupsData = await req.fileStorage.getGroups();
    if (!groupsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access group data'
      });
    }

    const group = groupsData.groups.find(g => g.id === id && g.isActive);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Group not found'
      });
    }

    // Check if user has access to this group
    const hasAccess = req.user.role === 'superAdmin' || 
                     group.members.includes(req.user.id) || 
                     group.admins.includes(req.user.id) || 
                     group.createdBy === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'You do not have access to this group'
      });
    }

    // Get user details for members
    const usersData = await req.fileStorage.getUsers();
    if (!usersData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access user data'
      });
    }

    const allMemberIds = [...new Set([...group.members, ...group.admins, group.createdBy])];
    const members = allMemberIds.map(memberId => {
      const user = usersData.users.find(u => u.id === memberId);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          isCreator: memberId === group.createdBy,
          isAdmin: group.admins.includes(memberId)
        };
      }
      return null;
    }).filter(Boolean);

    res.json({ members });
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve group members'
    });
  }
});

// GET /api/groups/:id - Get specific group
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const groupsData = await req.fileStorage.getGroups();
    
    if (!groupsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access group data'
      });
    }

    const group = groupsData.groups.find(g => g.id === id && g.isActive);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Group not found'
      });
    }

    // Check if user has access to this group
    const hasAccess = req.user.role === 'superAdmin' || 
                     group.members.includes(req.user.id) || 
                     group.admins.includes(req.user.id) || 
                     group.createdBy === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'You do not have access to this group'
      });
    }

    res.json({ group });
  } catch (error) {
    console.error('Get group by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve group'
    });
  }
});

// PUT /api/groups/:id - Update group
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const groupsData = await req.fileStorage.getGroups();
    if (!groupsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access group data'
      });
    }

    const groupIndex = groupsData.groups.findIndex(g => g.id === id && g.isActive);
    if (groupIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Group not found'
      });
    }

    const group = groupsData.groups[groupIndex];

    // Check permissions - only creator, admins, or super admin can update
    const canUpdate = req.user.role === 'superAdmin' || 
                     group.createdBy === req.user.id || 
                     group.admins.includes(req.user.id);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to update this group'
      });
    }

    // Update group fields
    if (name && name !== group.name) {
      // Check if new name already exists
      const existingGroup = groupsData.groups.find(g => 
        g.name === name && g.isActive && g.id !== id
      );
      if (existingGroup) {
        return res.status(409).json({
          success: false,
          error: 'GROUP_NAME_EXISTS',
          message: 'Group name already exists'
        });
      }
      group.name = name;
    }

    if (description !== undefined) {
      group.description = description;
    }

    groupsData.groups[groupIndex] = group;
    await req.fileStorage.saveGroups(groupsData);

    res.json({
      success: true,
      group: group
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to update group'
    });
  }
});

// DELETE /api/groups/:id - Delete group
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const groupsData = await req.fileStorage.getGroups();
    if (!groupsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access group data'
      });
    }

    const groupIndex = groupsData.groups.findIndex(g => g.id === id && g.isActive);
    if (groupIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Group not found'
      });
    }

    const group = groupsData.groups[groupIndex];

    // Check permissions - only creator or super admin can delete
    const canDelete = req.user.role === 'superAdmin' || group.createdBy === req.user.id;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to delete this group'
      });
    }

    // Soft delete - mark as inactive
    group.isActive = false;
    groupsData.groups[groupIndex] = group;

    // Also deactivate all channels in this group
    const channelsData = await req.fileStorage.getChannels();
    if (channelsData) {
      let channelsUpdated = false;
      channelsData.channels.forEach(channel => {
        if (channel.groupId === id && channel.isActive) {
          channel.isActive = false;
          channelsUpdated = true;
        }
      });
      if (channelsUpdated) {
        await req.fileStorage.saveChannels(channelsData);
      }
    }
    
    await req.fileStorage.saveGroups(groupsData);

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete group'
    });
  }
});

// POST /api/groups/:id/members - Add user to group
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

    const groupsData = await req.fileStorage.getGroups();
    if (!groupsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access group data'
      });
    }

    const groupIndex = groupsData.groups.findIndex(g => g.id === id && g.isActive);
    if (groupIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Group not found'
      });
    }

    const group = groupsData.groups[groupIndex];

    // Check permissions - only admins, creator, or super admin can add members
    const canAddMembers = req.user.role === 'superAdmin' || 
                         group.createdBy === req.user.id || 
                         group.admins.includes(req.user.id);

    if (!canAddMembers) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to add members to this group'
      });
    }

    // Check if user is already a member
    if (group.members.includes(userId) || group.admins.includes(userId)) {
      return res.status(409).json({
        success: false,
        error: 'USER_ALREADY_MEMBER',
        message: 'User is already a member of this group'
      });
    }

    // Verify user exists
    const usersData = await req.fileStorage.getUsers();
    const userExists = usersData && usersData.users.find(u => u.id === userId && u.isActive);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Add user to group
    group.members.push(userId);
    groupsData.groups[groupIndex] = group;
    await req.fileStorage.saveGroups(groupsData);

    res.json({
      success: true,
      message: 'User added to group successfully'
    });
  } catch (error) {
    console.error('Add member to group error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to add member to group'
    });
  }
});

// DELETE /api/groups/:id/members/:userId - Remove user from group
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { id, userId } = req.params;

    const groupsData = await req.fileStorage.getGroups();
    if (!groupsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access group data'
      });
    }

    const groupIndex = groupsData.groups.findIndex(g => g.id === id && g.isActive);
    if (groupIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Group not found'
      });
    }

    const group = groupsData.groups[groupIndex];

    // Check permissions - admins, creator, super admin, or the user themselves can remove
    const canRemoveMembers = req.user.role === 'superAdmin' || 
                            group.createdBy === req.user.id || 
                            group.admins.includes(req.user.id) ||
                            req.user.id === userId; // Users can remove themselves

    if (!canRemoveMembers) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to remove members from this group'
      });
    }

    // Cannot remove the creator
    if (userId === group.createdBy) {
      return res.status(400).json({
        success: false,
        error: 'CANNOT_REMOVE_CREATOR',
        message: 'Cannot remove the group creator'
      });
    }

    // Remove user from members and admins
    group.members = group.members.filter(memberId => memberId !== userId);
    group.admins = group.admins.filter(adminId => adminId !== userId);

    groupsData.groups[groupIndex] = group;
    await req.fileStorage.saveGroups(groupsData);

    res.json({
      success: true,
      message: 'User removed from group successfully'
    });
  } catch (error) {
    console.error('Remove member from group error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to remove member from group'
    });
  }
});

// POST /api/groups/:id/leave - Leave group (any member can leave)
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const groupsData = await req.fileStorage.getGroups();
    if (!groupsData) {
      return res.status(500).json({
        success: false,
        error: 'STORAGE_ERROR',
        message: 'Failed to access group data'
      });
    }

    const groupIndex = groupsData.groups.findIndex(g => g.id === id && g.isActive);
    if (groupIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Group not found'
      });
    }

    const group = groupsData.groups[groupIndex];

    // Check if user is a member of the group
    const isMember = group.members.includes(userId) || 
                    group.admins.includes(userId) || 
                    group.createdBy === userId;

    if (!isMember) {
      return res.status(400).json({
        success: false,
        error: 'NOT_A_MEMBER',
        message: 'You are not a member of this group'
      });
    }

    // Remove user from members array
    groupsData.groups[groupIndex].members = group.members.filter(id => id !== userId);
    
    // Remove user from admins array if they're an admin
    groupsData.groups[groupIndex].admins = group.admins.filter(id => id !== userId);

    // If the creator is leaving, we need to handle group ownership
    if (group.createdBy === userId) {
      // Option 1: Transfer ownership to first admin, or first member, or delete group
      if (group.admins.length > 0) {
        // Transfer to first admin (excluding the leaving user)
        const remainingAdmins = group.admins.filter(id => id !== userId);
        if (remainingAdmins.length > 0) {
          groupsData.groups[groupIndex].createdBy = remainingAdmins[0];
        } else if (group.members.filter(id => id !== userId).length > 0) {
          // Transfer to first remaining member and make them admin
          const remainingMembers = group.members.filter(id => id !== userId);
          groupsData.groups[groupIndex].createdBy = remainingMembers[0];
          groupsData.groups[groupIndex].admins.push(remainingMembers[0]);
        } else {
          // No one left, deactivate the group
          groupsData.groups[groupIndex].isActive = false;
        }
      } else if (group.members.filter(id => id !== userId).length > 0) {
        // No admins, transfer to first remaining member and make them admin
        const remainingMembers = group.members.filter(id => id !== userId);
        groupsData.groups[groupIndex].createdBy = remainingMembers[0];
        groupsData.groups[groupIndex].admins.push(remainingMembers[0]);
      } else {
        // No one left, deactivate the group
        groupsData.groups[groupIndex].isActive = false;
      }
    }

    // Also remove user from all channels in this group
    const channelsData = await req.fileStorage.getChannels();
    if (channelsData && channelsData.channels) {
      let channelsModified = false;
      
      // Find all channels that belong to this group and remove the user
      for (let i = 0; i < channelsData.channels.length; i++) {
        const channel = channelsData.channels[i];
        if (channel.groupId === id && channel.isActive) {
          // Remove user from channel members
          const originalMemberCount = channel.members.length;
          channelsData.channels[i].members = channel.members.filter(memberId => memberId !== userId);
          
          if (channel.members.length !== originalMemberCount) {
            channelsModified = true;
          }
        }
      }
      
      // Save channels data if any modifications were made
      if (channelsModified) {
        channelsData.metadata.lastModified = new Date().toISOString();
        await req.fileStorage.saveChannels(channelsData);
      }
    }

    groupsData.metadata.lastModified = new Date().toISOString();
    await req.fileStorage.saveGroups(groupsData);

    res.json({
      success: true,
      message: 'Successfully left the group and all its channels'
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to leave group'
    });
  }
});

module.exports = router;
