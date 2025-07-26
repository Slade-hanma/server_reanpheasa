const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payDate: {
    type: Date,
    default: Date.now
  },
  expireDate: {
    type: Date,
  }
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
