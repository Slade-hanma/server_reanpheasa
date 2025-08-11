const express = require('express');
const {
  createEnrollment,
  getAllEnrollments,
  getEnrollmentsByUserId,
  checkEnrollment,
  getEnrollmentById,
  deleteEnrollment,
  getMonthlyEnrollmentCounts
} = require('../controllers/enrollmentController');

const router = express.Router();

// POST /api/enrollments
router.post('/', createEnrollment);

// GET /api/enrollments
router.get('/', getAllEnrollments);
router.get('/monthly-counts', getMonthlyEnrollmentCounts);


// GET /api/enrollments/:id
router.get('/:id', getEnrollmentById);

router.get('/check/:userId/:courseId', checkEnrollment);


// DELETE /api/enrollments/:id
router.delete('/:id', deleteEnrollment);

module.exports = router;
