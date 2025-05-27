const Post = require('../models/Post');

// @desc    Get all active posts for users
// @route   GET /api/posts/userposts
// @access  Public/Protected (depending on your app structure)
exports.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    // Build query filter - only show active posts
    const filter = { isActive: true };
    
    // Add search functionality if search term is provided
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch posts with pagination
    const posts = await Post.find(filter)
      .populate('createdBy', 'username') // Only show creator's username
      .select('-__v') // Exclude version field
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination info
    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / parseInt(limit));

    res.status(200).json({
      success: true,
      posts: posts.map(post => ({
        id: post._id,
        title: post.title,
        author: post.author,
        content: post.content,
        image: post.image,
        createdBy: post.createdBy?.username || 'Unknown',
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      })),
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
// @route   GET /api/posts/userposts/:id
// @access  Public/Protected
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find post by ID, only if it's active
    const post = await Post.findOne({ _id: id, isActive: true })
      .populate('createdBy', 'username')
      .select('-__v');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or not available'
      });
    }

    res.status(200).json({
      success: true,
      post: {
        id: post._id,
        title: post.title,
        author: post.author,
        content: post.content,
        image: post.image,
        createdBy: post.createdBy?.username || 'Unknown',
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching post'
    });
  }
};