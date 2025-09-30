const express = require('express');
const router = express.Router();
const { authenticateToken, requireGroupAdmin } = require('../middleware/auth');

// GET /api/groups - Get all groups (filtered by user permissions)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let groups;
    
    // Filter groups based on user permissions
    if (req.user.role === 'superAdmin') {
      // Super Admin can see all groups
      groups = await req.mongodb.groups.find({ isActive: true }).toArray();
    } else {
      // Users can see groups they are members of, admins of, or created
      groups = await req.mongodb.groups.find({
        isActive: true,
        $or: [
          { members: req.user._id },
          { admins: req.user._id },
          { createdBy: req.user._id }
        ]
      }).toArray();
    }

    // Transform _id to id for frontend compatibility
    const groupsWithId = groups.map(group => ({
      ...group,
      id: group._id
    }));

    res.json({
      groups: groupsWithId
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

// GET /api/groups/my-groups - Get current user's groups
router.get('/my-groups', authenticateToken, async (req, res) => {
  try {
    const groups = await req.mongodb.groups.find({
      isActive: true,
      $or: [
        { members: req.user._id },
        { admins: req.user._id },
        { createdBy: req.user._id }
      ]
    }).toArray();

    // Transform _id to id for frontend compatibility
    const groupsWithId = groups.map(group => ({
      ...group,
      id: group._id
    }));

    res.json({
      groups: groupsWithId
    });
  } catch (error) {
    console.error('Get my groups error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve user groups'
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

    const createdBy = req.user._id;

    // Check if group name already exists
    const existingGroup = await req.mongodb.groups.findOne({
      name: name,
      isActive: true
    });

    if (existingGroup) {
      return res.status(409).json({
        success: false,
        error: 'GROUP_EXISTS',
        message: 'Group name already exists'
      });
    }

    // Create new group
    const newGroup = {
      _id: req.mongodb.generateId('group'),
      name,
      description,
      createdBy,
      admins: [createdBy],
      members: [createdBy],
      channels: [],
      createdAt: new Date(),
      isActive: true
    };

    await req.mongodb.groups.insertOne(newGroup);

    // Transform _id to id for frontend compatibility
    const groupWithId = {
      ...newGroup,
      id: newGroup._id
    };

    res.status(201).json({
      success: true,
      group: groupWithId
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

// GET /api/groups/:id - Get specific group details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const group = await req.mongodb.groups.findOne({ _id: id, isActive: true });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Group not found'
      });
    }

    // Check if user has access to this group
    const hasAccess = req.user.role === 'superAdmin' ||
                     group.members.includes(req.user._id) ||
                     group.admins.includes(req.user._id) ||
                     group.createdBy === req.user._id;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'You do not have access to this group'
      });
    }

    // Transform _id to id for frontend compatibility
    const groupWithId = {
      ...group,
      id: group._id
    };

    res.json({ group: groupWithId });

  } catch (error) {
    console.error('Get group by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve group'
    });
  }
});

// GET /api/groups/:id/members - Get group members with roles
router.get('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const group = await req.mongodb.groups.findOne({ _id: id, isActive: true });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Group not found'
      });
    }

    // Check if user has access to this group
    const hasAccess = req.user.role === 'superAdmin' ||
                     group.members.includes(req.user._id) ||
                     group.admins.includes(req.user._id) ||
                     group.createdBy === req.user._id;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'You do not have access to this group'
      });
    }

    // Get all member user details
    const allMemberIds = [...new Set([...group.members, ...group.admins])];
    const users = await req.mongodb.users.find({
      _id: { $in: allMemberIds },
      isActive: true
    }).toArray();

    // Map users with their roles in the group and add id field for frontend compatibility
    const membersWithRoles = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        id: user._id,
        groupRole: group.createdBy === user._id ? 'creator' :
                  group.admins.includes(user._id) ? 'admin' : 'member'
      };
    });

    res.json({
      members: membersWithRoles
    });

  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve group members'
    });
  }
});

// PUT /api/groups/:id - Update group details
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const group = await req.mongodb.groups.findOne({ _id: id, isActive: true });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Group not found'
      });
    }

    // Check if user can update this group (creator, admin, or super admin)
    const canUpdate = req.user.role === 'superAdmin' ||
                     group.createdBy === req.user._id ||
                     group.admins.includes(req.user._id);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to update this group'
      });
    }

    const updateData = {};

    // Check if name already exists (exclude current group)
    if (name && name !== group.name) {
      const existingGroup = await req.mongodb.groups.findOne({
        name: name,
        isActive: true,
        _id: { $ne: id }
      });

      if (existingGroup) {
        return res.status(409).json({
          success: false,
          error: 'GROUP_NAME_EXISTS',
          message: 'Group name already exists'
        });
      }
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (Object.keys(updateData).length > 0) {
      await req.mongodb.groups.updateOne(
        { _id: id },
        { $set: updateData }
      );
    }

    // Get updated group
    const updatedGroup = await req.mongodb.groups.findOne({ _id: id });

    // Transform _id to id for frontend compatibility
    const groupWithId = {
      ...updatedGroup,
      id: updatedGroup._id
    };

    res.json({
      success: true,
      group: groupWithId
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

    const group = await req.mongodb.groups.findOne({ _id: id, isActive: true });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Group not found'
      });
    }

    // Only creator or super admin can delete group
    const canDelete = req.user.role === 'superAdmin' || group.createdBy === req.user._id;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only the group creator or super admin can delete this group'
      });
    }

    // Soft delete - mark as inactive
    await req.mongodb.groups.updateOne(
      { _id: id },
      { 
        $set: { 
          isActive: false, 
          deletedAt: new Date() 
        } 
      }
    );

    // Also soft delete all channels in this group
    await req.mongodb.channels.updateMany(
      { groupId: id },
      { 
        $set: { 
          isActive: false, 
          deletedAt: new Date() 
        } 
      }
    );

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

    const group = await req.mongodb.groups.findOne({ _id: id, isActive: true });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Group not found'
      });
    }

    // Check if user can add members (admin, creator, or super admin)
    const canAddMembers = req.user.role === 'superAdmin' ||
                         group.createdBy === req.user._id ||
                         group.admins.includes(req.user._id);

    if (!canAddMembers) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to add members to this group'
      });
    }

    // Check if user exists
    const userToAdd = await req.mongodb.users.findOne({ _id: userId, isActive: true });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // Check if user is already a member
    if (group.members.includes(userId)) {
      return res.status(409).json({
        success: false,
        error: 'USER_ALREADY_MEMBER',
        message: 'User is already a member of this group'
      });
    }

    // Add user to group members
    await req.mongodb.groups.updateOne(
      { _id: id },
      { $push: { members: userId } }
    );

    res.json({
      success: true,
      message: 'User added to group successfully'
    });

  } catch (error) {
    console.error('Add group member error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to add user to group'
    });
  }
});

// DELETE /api/groups/:id/members/:userId - Remove user from group
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { id, userId } = req.params;

    const group = await req.mongodb.groups.findOne({ _id: id, isActive: true });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Group not found'
      });
    }

    // Check permissions - admins, creator, super admin, or user removing themselves
    const canRemove = req.user.role === 'superAdmin' ||
                     group.createdBy === req.user._id ||
                     group.admins.includes(req.user._id) ||
                     req.user._id === userId;

    if (!canRemove) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to remove this user from the group'
      });
    }

    // Cannot remove the group creator
    if (group.createdBy === userId) {
      return res.status(400).json({
        success: false,
        error: 'CANNOT_REMOVE_CREATOR',
        message: 'Cannot remove the group creator'
      });
    }

    // Remove user from both members and admins arrays
    await req.mongodb.groups.updateOne(
      { _id: id },
      { 
        $pull: { 
          members: userId,
          admins: userId
        } 
      }
    );

    // Remove user from all channels in this group
    await req.mongodb.channels.updateMany(
      { groupId: id },
      { $pull: { members: userId } }
    );

    res.json({
      success: true,
      message: 'User removed from group successfully'
    });

  } catch (error) {
    console.error('Remove group member error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to remove user from group'
    });
  }
});

// POST /api/groups/:id/leave - Leave group
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await req.mongodb.groups.findOne({ _id: id, isActive: true });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'GROUP_NOT_FOUND',
        message: 'Group not found'
      });
    }

    // Cannot leave if user is the group creator
    if (group.createdBy === userId) {
      return res.status(400).json({
        success: false,
        error: 'CANNOT_LEAVE_OWN_GROUP',
        message: 'Group creator cannot leave their own group'
      });
    }

    // Check if user is actually a member
    if (!group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'NOT_A_MEMBER',
        message: 'You are not a member of this group'
      });
    }

    // Remove user from group
    await req.mongodb.groups.updateOne(
      { _id: id },
      { 
        $pull: { 
          members: userId,
          admins: userId
        } 
      }
    );

    // Remove user from all channels in this group
    await req.mongodb.channels.updateMany(
      { groupId: id },
      { $pull: { members: userId } }
    );

    res.json({
      success: true,
      message: 'Left group successfully'
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