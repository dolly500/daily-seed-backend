const express = require('express');
const router = express.Router();
const { createPost, getAllPosts, getPostById, updatePost, deletePost, getTotalPosts, getTotalUsers, getAllUsers} = require('../controllers/adminController');
const auth = require('../middleware/auth');

router.get('/total-users', auth, getTotalUsers);
router.get('/users/getalluseradmin', auth, getAllUsers);

// Post management routes
router.post('/posts', auth, createPost);
router.get('/posts', auth, getAllPosts);

router.get('/posts/:id', auth, getPostById);
router.put('/posts/:id', auth, updatePost);
router.delete('/posts/:id', auth, deletePost)
router.get('/total-posts', auth, getTotalPosts);


module.exports = router;
