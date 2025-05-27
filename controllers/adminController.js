const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const Streak = require('../models/Streak');
const Post = require('../models/Post'); 

// @desc    Get total number of users and active users
// @route   GET /api/admin/total-users
// @access  Private (Admin only)
exports.getTotalUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admins only.'
      });
    }

    // Fetch all users
    const users = await User.find({});
    const totalUsers = users.length;

    // Count only active users
    const activeUsersCount = await User.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      totalUsers,
      activeUsers: activeUsersCount
    });
  } catch (error) {
    console.error('Error fetching total users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @route   GET /api/admin/users/getalluseradmin
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // Check admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admins only.'
      });
    }

    // Get all non-admin users
    // const users = await User.find({ role: 'user' }).select(
    //   'username email avatar isActive'
    // );
    const users = await User.find({})

    // Fetch progress and streaks in parallel
    const userIds = users.map((u) => u._id);

    const [progressData, streakData] = await Promise.all([
      UserProgress.find({ user: { $in: userIds } }),
      Streak.find({ user: { $in: userIds } })
    ]);

    // Map user progress and streaks by user ID for quick lookup
    const progressMap = new Map();
    const streakMap = new Map();

    progressData.forEach((prog) => {
      const oldTestament = prog.booksRead?.filter((b) => b.testament === 'Old Testament') || [];
      const newTestament = prog.booksRead?.filter((b) => b.testament === 'New Testament') || [];
      const totalOldBooks = 39;
      const totalNewBooks = 27;
      const oldProgress = (oldTestament.filter(b => b.completed).length / totalOldBooks) * 100;
      const newProgress = (newTestament.filter(b => b.completed).length / totalNewBooks) * 100;

      progressMap.set(prog.user.toString(), {
        oldTestamentProgress: Math.round(oldProgress),
        newTestamentProgress: Math.round(newProgress)
      });
    });

    streakData.forEach((s) => {
      streakMap.set(s.user.toString(), {
        currentStreak: s.currentStreak
      });
    });

    // Combine all info
    const userList = users.map((user) => {
      const progress = progressMap.get(user._id.toString()) || {
        oldTestamentProgress: 0,
        newTestamentProgress: 0
      };

      const streak = streakMap.get(user._id.toString()) || {
        currentStreak: 0
      };

      return {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isActive: user.isActive,
        oldTestamentProgress: progress.oldTestamentProgress,
        newTestamentProgress: progress.newTestamentProgress,
        currentStreak: streak.currentStreak
      };
    });

    res.status(200).json({
      success: true,
      users: userList
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create a new post
// @route   POST /api/admin/posts
// @access  Private (Admin only)
exports.createPost = async (req, res) => {
  try {
    // Check admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admins only.'
      });
    }

    const { title, author, content, image } = req.body;

    // Validate required fields
    if (!title || !author || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title, author, and content are required fields'
      });
    }

    // Create new post
    const newPost = new Post({
      title,
      author,
      content,
      image: image || null,
      createdBy: req.user.id
    });

    // Save post to database
    const savedPost = await newPost.save();

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: {
        id: savedPost._id,
        title: savedPost.title,
        author: savedPost.author,
        content: savedPost.content,
        image: savedPost.image,
        isActive: savedPost.isActive,
        createdAt: savedPost.createdAt,
        updatedAt: savedPost.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating post'
    });
  }
};

// @desc    Get all posts
// @route   GET /api/admin/posts
// @access  Private (Admin only)
exports.getAllPosts = async (req, res) => {
  try {
    // Check admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admins only.'
      });
    }

    const { page = 1, limit = 10, isActive } = req.query;
    
    // Build query filter
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch posts with pagination
    const posts = await Post.find(filter)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination info
    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / parseInt(limit));

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPosts,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching posts'
    });
  }
};

// @desc    Get single post by ID
// @route   GET /api/admin/posts/:id
// @access  Private (Admin only)
exports.getPostById = async (req, res) => {
  try {
    // Check admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admins only.'
      });
    }

    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format'
      });
    }

    const post = await Post.findById(id).populate('createdBy', 'username email');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching post'
    });
  }
};

// @desc    Update or edit post by ID
// @route   PUT /api/admin/posts/:id
// @access  Private (Admin only)
exports.updatePost = async (req, res) => {
  try {
    // Check admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admins only.'
      });
    }

    const { id } = req.params;
    const { title, author, content, image, isActive } = req.body;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format'
      });
    }

    // Check if post exists
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Prepare update object
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (author !== undefined) updateData.author = author;
    if (content !== undefined) updateData.content = content;
    if (image !== undefined) updateData.image = image;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = Date.now();

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('createdBy', 'username email');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Error updating post:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating post'
    });
  }
}; 

// @desc    Delete post by ID
// @route   DELETE /api/admin/posts/:id
// @access  Private (Admin only)
exports.deletePost = async (req, res) => {
  try {
    // Check admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admins only.'
      });
    }

    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format'
      });
    }

    // Find and delete post
    const deletedPost = await Post.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      deletedPost: {
        id: deletedPost._id,
        title: deletedPost.title,
        author: deletedPost.author
      }
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting post'
    });
  }
};

// @desc    Get total number of posts and active posts
// @route   GET /api/admin/total-posts
// @access  Private (Admin only)
exports.getTotalPosts = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admins only.'
      });
    }

    // Get total posts count
    const totalPosts = await Post.countDocuments({});
    
    // Get active posts count
    const activePosts = await Post.countDocuments({ isActive: true });
    
    // Get inactive posts count
    const inactivePosts = await Post.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      totalPosts,
      activePosts,
      inactivePosts
    });
  } catch (error) {
    console.error('Error fetching total posts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};