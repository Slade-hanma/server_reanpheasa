const Comment = require('../models/commentModel');

// Create comment
const createComment = async (req, res) => {
  try {
    console.log('Received createComment body:', req.body);
    const newComment = await Comment.create({ ...req.body });
    res.status(201).json(newComment);
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(400).json({ error: err.message });
  }
};


// Get all comments
const getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find();
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update comment
const updateComment = async (req, res) => {
  try {
    const updated = await Comment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, update: new Date() },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete comment
const deleteComment = async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all comments (optionally filter by course_id query parameter)
const getAllCommentsbyCourseId = async (req, res) => {
  try {
    const courseId = req.params.courseid;
    console.log('Fetching comments for course ID:', courseId);
    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    const comments = await Comment.find({ course_id: courseId }).populate('user_id');
    console.log('Found comments:', comments.length);
    res.status(200).json(comments);
  } catch (err) {
    console.error('Error in getAllCommentsbyCourseId:', err);
    res.status(500).json({ error: err.message });
  }
};




module.exports = {
  createComment,
  getAllComments,
  updateComment,
  deleteComment,
  getAllCommentsbyCourseId,
};



