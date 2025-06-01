// controllers/communityController.js
const { validationResult } = require('express-validator');
const Community = require('../models/Community');
const Message = require('../models/Message');
const User = require('../models/User');

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

    const { name, description, settings } = req.body;

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
      createdBy: req.user.id,
      settings: settings || {},
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
        createdBy: community.createdBy,
        memberCount: community.memberCount,
        settings: community.settings,
        createdAt: community.createdAt
      }
    });
  } catch (error) {
    console.error('Create community error:', error);
    next(error);
  }
};

// @desc    Get all communities
// @route   GET /api/communities
// @access  Private
exports.getCommunities = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const communities = await Community.find({ isActive: true })
      .populate('createdBy', 'username')
      .select('name description memberCount settings createdAt')
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

// @desc    Join community
// @route   POST /api/communities/:id/join
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

    // Check if user is already a member
    if (community.isMember(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this community'
      });
    }

    // Check member limit
    if (community.members.length >= community.settings.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Community has reached maximum member limit'
      });
    }

    // Add user to community
    community.members.push({
      user: req.user.id,
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
// @route   DELETE /api/communities/:id/leave
// @access  Private
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
// @route   GET /api/communities/:id/messages
// @access  Private
exports.getCommunityMessages = async (req, res, next) => {
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
// @route   POST /api/communities/:id/messages
// @access  Private
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

    // Check if user is a member
    if (!community.isMember(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a member to send messages.'
      });
    }

    const { content } = req.body;

    const message = await Message.create({
      content,
      sender: req.user.id,
      community: req.params.id
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

// @desc    Get user's communities
// @route   GET /api/communities/my-communities
// @access  Private
exports.getMyCommunities = async (req, res, next) => {
  try {
    const communities = await Community.find({
      'members.user': req.user.id,
      isActive: true
    })
      .populate('createdBy', 'username')
      .select('name description memberCount settings createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      communities
    });
  } catch (error) {
    console.error('Get my communities error:', error);
    next(error);
  }
};