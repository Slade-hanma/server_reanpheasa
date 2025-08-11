const express = require('express');
const {
  getAllLikes,
  likeOrDislike,
  getLikesByComment,
  getLikesCountByComment
} = require('../controllers/commentLikeController');

const router = express.Router();

router.get('/', getAllLikes); 
router.post('/', likeOrDislike);
router.get('/:commentId', getLikesByComment);
router.get('/count/:commentId', getLikesCountByComment);


module.exports = router;
