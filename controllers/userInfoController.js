const UserInfo = require('../models/UserInfoModel');


// Get All UserInfo
exports.getAllUserInfo = async (req, res) => {
  try {
    const allInfo = await UserInfo.find();
    res.json(allInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Create new UserInfo
exports.createUserInfo = async (req, res) => {
  const {
    userId,
    gmail,
    facebook,
    instagram,
    telegram,
    linkedIn,
    twitter,
    description
  } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    // Check if already exists
    const existing = await UserInfo.findOne({ userId });
    if (existing) {
      return res.status(409).json({ message: 'User info already exists' });
    }

    const newInfo = await UserInfo.create({
      userId,
      gmail,
      facebook,
      instagram,
      telegram,
      linkedIn,
      twitter,
      description
    });

    res.status(201).json({ message: 'User info created', data: newInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get UserInfo by userId
exports.getUserInfo = async (req, res) => {
  const { userId } = req.params;

  try {
    const info = await UserInfo.findOne({ userId });

    if (!info) {
      return res.status(404).json({ message: 'User info not found' });
    }

    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update UserInfo partially by userId
exports.updateUserInfo = async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;

  try {
    const updated = await UserInfo.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'User info not found' });
    }

    res.json({ message: 'User info updated', data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete UserInfo by userId
exports.deleteUserInfo = async (req, res) => {
  const { userId } = req.params;

  try {
    const deleted = await UserInfo.findOneAndDelete({ userId });

    if (!deleted) {
      return res.status(404).json({ message: 'User info not found' });
    }

    res.json({ message: 'User info deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
