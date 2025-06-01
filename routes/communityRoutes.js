const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
  createCommunity,
  getCommunities,
  joinCommunity,
  leaveCommunity,
  getCommunityMessages,
  sendMessage,
  getMyCommunities
} = require('../controllers/communityController');

// Get all communities with pagination and search
router.get('/communities', auth, getCommunities);

// Get user's joined communities
router.get('/communities/my-communities', auth, getMyCommunities);

// Create new community
router.post('/communities', auth, createCommunity);

// Join a community
router.post('/communities/:id/join', auth, joinCommunity);

// Leave a community
router.delete('/communities/:id/leave', auth, leaveCommunity);

// Get community messages
router.get('/communities/:id/messages', auth, getCommunityMessages);

// Send message to community
router.post('/communities/:id/messages', auth, sendMessage);

module.exports = router;