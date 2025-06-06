// controllers/communityController.js
const { validationResult } = require('express-validator');
const Community = require('../models/Community');
const Message = require('../models/Message');


// @desc    Create new community (Admin only)
// @route   POST /api/communities
// @access  Private/Admin
exports.createCommunity = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { 
      name, 
      description, 
      image,
      settings = {},
      policy = {} 
    } = req.body;

    // Check if community name already exists
    const existingCommunity = await Community.findOne({ 
      name: new RegExp(`^${name}$`, 'i') 
    });

    if (existingCommunity) {
      return res.status(400).json({
        success: false,
        message: 'Community with this name already exists'
      });
    }

    const community = await Community.create({
      name,
      description,
      image: image || null,
      createdBy: req.user.id,
      settings: {
        maxMembers: settings.maxMembers || 1000,
        isPrivate: settings.isPrivate || false,
        requireApproval: settings.requireApproval || false,
        ...settings
      },
      policy: {
        openToAllUsers: policy.openToAllUsers !== undefined ? policy.openToAllUsers : true,
        flagPhoneNumbers: policy.flagPhoneNumbers !== undefined ? policy.flagPhoneNumbers : true,
        flagLinks: policy.flagLinks !== undefined ? policy.flagLinks : true,
        flagEmails: policy.flagEmails !== undefined ? policy.flagEmails : true,
        inappropriateLanguages: policy.inappropriateLanguages !== undefined ? policy.inappropriateLanguages : true,
        ...policy
      },
      members: [{
        user: req.user.id,
        role: 'moderator',
        joinedAt: new Date()
      }]
    });

    await community.populate('createdBy', 'username email');

    res.status(201).json({
      success: true,
      community: {
        id: community._id,
        name: community.name,
        description: community.description,
        image: community.image,
        createdBy: community.createdBy,
        memberCount: community.memberCount,
        settings: community.settings,
        policy: community.policy,
        createdAt: community.createdAt
      }
    });
  } catch (error) {
    console.error('Create community error:', error);
    next(error);
  }
};

// @desc    Get all communities
// @route   GET /api/communities/communities
// @access  Private/User/Admin
exports.getCommunities = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const communities = await Community.find({ isActive: true })
      .populate('createdBy', 'username')
      .select('name description image memberCount settings policy createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Community.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      communities,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get communities error:', error);
    next(error);
  }
};

// @desc    Get community details
// @route   GET /api/communities/communities/:id
// @access  Private/User/Admin
exports.getCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('members.user', 'username email avatar');

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Check if user is a member or admin
    const isMember = community.isMember(req.user.id);
    const isAdmin = req.user.role === 'admin';
    const isModerator = community.members.find(
      member => member.user._id.toString() === req.user.id.toString() && member.role === 'moderator'
    );

    // Allow admin to access private communities even if not a member
    if (!isMember && !isAdmin && community.settings.isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This is a private community.'
      });
    }

    res.status(200).json({
      success: true,
      community: {
        id: community._id,
        name: community.name,
        description: community.description,
        image: community.image,
        createdBy: community.createdBy,
        memberCount: community.memberCount,
        members: isAdmin || isModerator ? community.members : undefined,
        settings: community.settings,
        policy: isAdmin || isModerator ? community.policy : undefined,
        createdAt: community.createdAt,
        userRole: isMember ? community.members.find(m => m.user._id.toString() === req.user.id.toString())?.role : (isAdmin ? 'admin' : null)
      }
    });
  } catch (error) {
    console.error('Get community error:', error);
    next(error);
  }
};

// @desc    Update community settings (Admin/Moderator only)
// @route   PUT /api/communities/communities/:id/settings
// @access  Private/Admin/Moderator
exports.updateCommunitySettings = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Check if user is admin or moderator
    const isAdmin = req.user.role === 'admin';
    const isModerator = community.members.find(
      member => member.user.toString() === req.user.id.toString() && member.role === 'moderator'
    );

    if (!isAdmin && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or moderator role required.'
      });
    }

    const { settings, policy } = req.body;

    if (settings) {
      community.settings = { ...community.settings, ...settings };
    }

    if (policy) {
      community.policy = { ...community.policy, ...policy };
    }

    await community.save();

    res.status(200).json({
      success: true,
      message: 'Community settings updated successfully',
      community: {
        id: community._id,
        settings: community.settings,
        policy: community.policy
      }
    });
  } catch (error) {
    console.error('Update community settings error:', error);
    next(error);
  }
};

// @desc    Get flagged messages
// @route   GET /api/communities/communities/:id/flagged-messages
// @access  Private/Admin/Moderator
exports.getFlaggedMessages = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Check if user is admin or moderator
    const isAdmin = req.user.role === 'admin';
    const isModerator = community.members.find(
      member => member.user.toString() === req.user.id.toString() && member.role === 'moderator'
    );

    if (!isAdmin && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or moderator role required.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const flaggedMessages = await Message.find({ 
      community: req.params.id,
      isFlagged: true,
      isDeleted: false 
    })
      .populate('sender', 'username avatar')
      .populate('flaggedBy', 'username')
      .sort({ flaggedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ 
      community: req.params.id,
      isFlagged: true,
      isDeleted: false 
    });

    res.status(200).json({
      success: true,
      flaggedMessages,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get flagged messages error:', error);
    next(error);
  }
};

// @desc    Flag/Unflag message
// @route   PUT /api/communities/communities/:id/messages/:messageId/flag
// @access  Private/Admin/Moderator
exports.toggleMessageFlag = async (req, res, next) => {
  try {
    const { id: communityId, messageId } = req.params;
    const { flagReason } = req.body;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Check if user is admin or moderator
    const isAdmin = req.user.role === 'admin';
    const isModerator = community.members.find(
      member => member.user.toString() === req.user.id.toString() && member.role === 'moderator'
    );

    if (!isAdmin && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or moderator role required.'
      });
    }

    const message = await Message.findById(messageId);
    if (!message || message.community.toString() !== communityId) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    message.isFlagged = !message.isFlagged;
    if (message.isFlagged) {
      message.flaggedBy = req.user.id;
      message.flaggedAt = new Date();
      message.flagReason = flagReason || 'No reason provided';
    } else {
      message.flaggedBy = undefined;
      message.flaggedAt = undefined;
      message.flagReason = undefined;
    }

    await message.save();

    res.status(200).json({
      success: true,
      message: `Message ${message.isFlagged ? 'flagged' : 'unflagged'} successfully`
    });
  } catch (error) {
    console.error('Toggle message flag error:', error);
    next(error);
  }
};

// @desc    Delete community (Admin only)
// @route   DELETE /api/communities/communities/:id
// @access  Private/Admin
exports.deleteCommunity = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Soft delete
    community.isActive = false;
    community.deletedAt = new Date();
    await community.save();

    res.status(200).json({
      success: true,
      message: 'Community deleted successfully'
    });
  } catch (error) {
    console.error('Delete community error:', error);
    next(error);
  }
};

// @desc    Join community
// @route   POST /api/communities/communities/:id/join
// @access  Private
exports.joinCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    if (!community.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Community is not active'
      });
    }

    const isAdmin = req.user.role === 'admin';

    // Allow admin to join any community, bypass restrictions
    if (!isAdmin) {
      // Check if community is open to all users
      if (!community.policy.openToAllUsers) {
        return res.status(403).json({
          success: false,
          message: 'This community is not open to all users'
        });
      }
    }

    // Check if user is already a member
    if (community.isMember(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this community'
      });
    }

    // Check member limit (admins can bypass this)
    if (!isAdmin && community.members.length >= community.settings.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Community has reached maximum member limit'
      });
    }

    // Add user to community with appropriate role
    community.members.push({
      user: req.user.id,
      role: isAdmin ? 'moderator' : 'member', // Give admin moderator role
      joinedAt: new Date()
    });

    await community.save();

    // Create system message
    await Message.create({
      content: `${req.user.username} joined the community`,
      sender: req.user.id,
      community: community._id,
      messageType: 'system'
    });

    res.status(200).json({
      success: true,
      message: 'Successfully joined the community'
    });
  } catch (error) {
    console.error('Join community error:', error);
    next(error);
  }
};

// @desc    Leave community
// @route   DELETE /api/communities/communities/:id/leave
// @access  Private/User
exports.leaveCommunity = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Check if user is a member
    if (!community.isMember(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this community'
      });
    }

    // Remove user from community
    community.members = community.members.filter(
      member => member.user.toString() !== req.user.id.toString()
    );

    await community.save();

    // Create system message
    await Message.create({
      content: `${req.user.username} left the community`,
      sender: req.user.id,
      community: community._id,
      messageType: 'system'
    });

    res.status(200).json({
      success: true,
      message: 'Successfully left the community'
    });
  } catch (error) {
    console.error('Leave community error:', error);
    next(error);
  }
};

// @desc    Get community messages
// @route   GET /api/communities/communities/:id/messages
// @access  Private/Admin/User
exports.getCommunityMessages = async (req, res, next) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    const isAdmin = req.user.role === 'admin';
    const isMember = community.isMember(req.user.id);

    // Allow admin to view messages from any community, even if not a member
    if (!isAdmin && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member to view messages.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ 
      community: req.params.id,
      isDeleted: false 
    })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      messages: messages.reverse() // Reverse to show oldest first
    });
  } catch (error) {
    console.error('Get community messages error:', error);
    next(error);
  }
};

// @desc    Send message to community
// @route   POST /api/communities/communities/:id/messages
// @access  Private/User
exports.sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    const isAdmin = req.user.role === 'admin';
    const isMember = community.isMember(req.user.id);

    // Allow admin to send messages to any community, even if not a member
    if (!isAdmin && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member to send messages.'
      });
    }

    const { content } = req.body;

    // Auto-flag content based on community policy (admins bypass auto-flagging)
    let isFlagged = false;
    let flagReason = '';

    if (!isAdmin) { // Skip auto-flagging for admins
      if (community.policy.flagPhoneNumbers && /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(content)) {
        isFlagged = true;
        flagReason = 'Contains phone number';
      } else if (community.policy.flagEmails && /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(content)) {
        isFlagged = true;
        flagReason = 'Contains email address';
      } else if (community.policy.flagLinks && /(https?:\/\/[^\s]+)/g.test(content)) {
        isFlagged = true;
        flagReason = 'Contains link';
      }
    }

    const message = await Message.create({
      content,
      sender: req.user.id,
      community: req.params.id,
      isFlagged,
      flagReason: isFlagged ? flagReason : undefined,
      flaggedAt: isFlagged ? new Date() : undefined
    });

    await message.populate('sender', 'username avatar');

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Send message error:', error);
    next(error);
  }
};

