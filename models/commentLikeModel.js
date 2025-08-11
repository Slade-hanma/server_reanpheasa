const mongoose = require('mongoose');

const commentLikeSchema = new mongoose.Schema({
  comment_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Comment' },
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  like: { type: Boolean, required: true },
  date: { type: Date, default: Date.now },
  update: { type: Date, default: null },
});

module.exports = mongoose.model('CommentLike', commentLikeSchema);
