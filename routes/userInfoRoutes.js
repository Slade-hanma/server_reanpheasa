const express = require('express');
const router = express.Router();
const userInfoController = require('../controllers/UserInfoController');

router.get('/', userInfoController.getAllUserInfo);  // GET /api/user-info/
// Create new UserInfo (POST)
router.post('/', userInfoController.createUserInfo);

// Get UserInfo by userId (GET)
router.get('/:userId', userInfoController.getUserInfo);

// Update UserInfo partially by userId (PATCH)
router.patch('/:userId', userInfoController.updateUserInfo);

// Delete UserInfo by userId (DELETE)
router.delete('/:userId', userInfoController.deleteUserInfo);

module.exports = router;
