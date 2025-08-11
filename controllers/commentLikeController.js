const CommentLike = require('../models/commentLikeModel');


// Get all likes
const getAllLikes = async (req, res) => {
  try {
    const likes = await CommentLike.find({});
    res.status(200).json(likes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Create or update like
const likeOrDislike = async (req, res) => {
  const { comment_id, user_id, like } = req.body;

  try {
    const existing = await CommentLike.findOne({ comment_id, user_id });

    if (existing) {
      existing.like = like;
      existing.update = new Date();
      await existing.save();
      res.status(200).json(existing);
    } else {
      const newLike = await CommentLike.create({ comment_id, user_id, like });
      res.status(201).json(newLike);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get likes by comment
const getLikesByComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const likesDocs = await CommentLike.find({ comment_id: commentId, like: true }).select('user_id');
    const count = likesDocs.length;
    const likedBy = likesDocs.map(doc => doc.user_id.toString());
    res.status(200).json({ count, likedBy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get count of likes for a specific comment
const getLikesCountByComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const count = await CommentLike.countDocuments({ comment_id: commentId, like: true });
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



module.exports = {
  getAllLikes,
  likeOrDislike,
  getLikesByComment,
  getLikesCountByComment
};
