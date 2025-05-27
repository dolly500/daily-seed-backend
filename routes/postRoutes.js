const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
  getAllPosts,
  getPostById,
} = require('../controllers/postController');



// Get all posts with pagination and search
router.get('/userposts', auth, getAllPosts);

// Get single post by ID (must be last to avoid conflicts)
router.get('/userposts/:id', auth, getPostById);



module.exports = router;