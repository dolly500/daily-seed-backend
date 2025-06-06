const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
  createCommunity,
  getCommunities,
  getCommunity,
  updateCommunitySettings,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityMessages,
  sendMessage,
  getFlaggedMessages,
  toggleMessageFlag
} = require('../controllers/communityController');

// Get all communities with pagination and search
router.get('/communities', auth, getCommunities);


// Create new community (Admin only)
router.post('/communities', auth, createCommunity);

// Get specific community details
router.get('/communities/:id', auth, getCommunity);

// Update community settings (Admin/Moderator only)
router.put('/communities/:id/settings', auth, updateCommunitySettings);

// Delete community (Admin only)
router.delete('/communities/:id', auth, deleteCommunity);

// Join a community(Admin and user only)
router.post('/communities/:id/join', auth, joinCommunity);

// Leave a community(user)
router.delete('/communities/:id/leave', auth, leaveCommunity);

// Get community messages(admin/user)
router.get('/communities/:id/messages', auth, getCommunityMessages);

// Send message to community(user)
router.post('/communities/:id/messages', auth, sendMessage);

// Get flagged messages (Admin/Moderator only)
router.get('/communities/:id/flagged-messages', auth, getFlaggedMessages);

// Flag/Unflag message (Admin/Moderator only)
router.put('/communities/:id/messages/:messageId/flag', auth, toggleMessageFlag);

module.exports = router;