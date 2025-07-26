const express = require('express');
const {
  createEnrollment,
  getAllEnrollments,
  getEnrollmentsByUserId,
  checkEnrollment,
  getEnrollmentById,
  deleteEnrollment,
} = require('../controllers/enrollmentController');

const router = express.Router();

// POST /api/enrollments
router.post('/', createEnrollment);

// GET /api/enrollments
router.get('/', getAllEnrollments);

// GET /api/enrollments/:id
router.get('/:id', getEnrollmentById);

router.get('/user/:userId', getEnrollmentsByUserId);
router.get('/check/:userId/:courseId', checkEnrollment);


// DELETE /api/enrollments/:id
router.delete('/:id', deleteEnrollment);

module.exports = router;
