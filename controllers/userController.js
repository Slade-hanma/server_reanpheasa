const User = require('../models/userModel');
const fs = require('fs');
const path = require('path');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cloudinary = require('../config/cloudinaryConfig');



const createToken = (_id) => {
  return jwt.sign({_id}, process.env.SECRET, { expiresIn: '3d' })
}

// login a user
const loginUser = async (req, res) => {
  const {email, password} = req.body

  try {
    const user = await User.login(email, password)

    // create a token
    const token = createToken(user._id)
const responseData = { email, token, role: user.role }

    console.log('Login response data:', responseData)

    return res.status(200).json(responseData);

  } catch (error) {
    res.status(400).json({error: error.message})
  }
}

// signup a user
const signupUser = async (req, res) => {
  const {firstName, lastName, dateOfBirth, sex, phoneNumber, city, country, email, password, role, image} = req.body
     console.log('Role received in controller:', req.body.role);

  try {
    const user = await User.signup(firstName, lastName, dateOfBirth, sex, phoneNumber, city, country, email, password, role, image)
    
    // create a token
    const token = createToken(user._id)

    res.status(200).json({email, token})
  } catch (error) {
    res.status(400).json({error: error.message})
  }
}

// GET all users
// GET all users where role is "student"
// GET all users or filtered by role
const getUsers = async (req, res) => {
  try {
    const role = req.query.role;
    const filter = role ? { role } : {}; // filter by role if provided

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// GET one user
const getUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// CREATE new user
const createUser = async (req, res) => {
  try {
    const userData = req.body;

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'users' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
      userData.image = uploadResult.secure_url;
    }

    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const user = await User.create(userData);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// UPDATE user
const updateUser = async (req, res) => {
  const { id } = req.params;
  try {
    const updates = req.body;

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'users' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
      updates.image = uploadResult.secure_url;
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// DELETE user
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Optional: delete image file from uploads folder
    if (user.image) {
      const imagePath = path.join(__dirname, '..', 'uploads', user.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getUserCount = async (req, res) => {
  try {
    console.log('Query:', req.query);

    const role = req.query.role;
    const filter = role ? { role } : {};
    console.log('Filter used:', filter);

    const count = await User.countDocuments(filter);
    res.status(200).json({ totalUsers: count });
  } catch (err) {
    console.error('Error in getUserCount:', err);
    res.status(500).json({ error: err.message });
  }
};

// const deleteNonAdminUsers = async (req, res) => {
//   try {
//     const result = await User.deleteMany({ role: { $ne: 'admin' } });
//     res.status(200).json({ message: `${result.deletedCount} non-admin users deleted.` });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  signupUser, loginUser,
  getUserCount,
  // deleteNonAdminUsers
};


// {
//     "firstName": "John",
//     "lastName": "doe",
//     "dateOfBirth": "2025-07-16T00:00:00.000Z",
//     "sex": "Male",
//     "phoneNumber": "098902022",
//     "city": "Phnom Penh",
//     "country": "Cambodia",
//     "email": "johnD@gmail.com",
//     "password": "JohnD123@",
//     "role": "student",
//     "image": "null"
// }