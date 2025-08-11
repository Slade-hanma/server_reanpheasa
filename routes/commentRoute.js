const express = require('express');
const {
  createComment,
  getAllComments,
  updateComment,
  deleteComment,
  getAllCommentsbyCourseId
} = require('../controllers/commentController');

const router = express.Router();

router.post('/', createComment);
router.get('/', getAllComments);
router.get('/course/:courseid', getAllCommentsbyCourseId);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

module.exports = router;
