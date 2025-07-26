const mongoose = require('mongoose');

const userInfoSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  gmail: {
    type: String,
  },
  facebook: String,
  instagram: String,
  telegram: String,
  linkedIn: String,
  twitter: String,
  description: String
}, { timestamps: true });

module.exports = mongoose.model('UserInfo', userInfoSchema);
