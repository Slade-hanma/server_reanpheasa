const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  signupUser,
  getUserCount,
  // deleteNonAdminUsers 
} = require('../controllers/userController');

router.get('/count', getUserCount);

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', upload.single('image'), createUser);
router.patch('/:id', upload.single('image'), updateUser);
router.delete('/:id', deleteUser);

router.post('/login', loginUser);
router.post('/signup', signupUser);



module.exports = router;

// router.delete('/delete-non-admins', deleteNonAdminUsers);