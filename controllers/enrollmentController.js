const Enrollment = require('../models/enrollmentModel');

// Create new enrollment

const createEnrollment = async (req, res) => {
  const { courseId, userId } = req.body;
  console.log('Incoming body:', req.body);


  try {
    const enrollment = await Enrollment.create({ courseId, userId });
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all enrollments
const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find().populate('courseId').populate('userId');
    res.status(200).json(enrollments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get enrollments by userId
const getEnrollmentsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find enrollments where userId matches, populate courseId to get course details if you want
    const enrollments = await Enrollment.find({ userId }).populate('courseId');
    res.status(200).json(enrollments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const checkEnrollment = async (req, res) => {
  const { userId, courseId } = req.params;

  try {
    const enrollment = await Enrollment.findOne({
      userId: userId,
      courseId: courseId
    });

    res.json({ enrolled: !!enrollment }); // true if found, false if not
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};


// Get single enrollment by ID
const getEnrollmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const enrollment = await Enrollment.findById(id).populate('courseId').populate('userId');
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    res.status(200).json(enrollment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete enrollment
const deleteEnrollment = async (req, res) => {
  const { id } = req.params;
  try {
    const enrollment = await Enrollment.findByIdAndDelete(id);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    res.status(200).json({ message: 'Enrollment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMonthlyEnrollmentCounts = async (req, res) => {
  try {
    // Aggregation pipeline to group enrollments by year & month of createdAt and count them
    const counts = await Enrollment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      }
    ]);

    // Format the output for easier frontend use
    // Example: [{ year: 2023, month: 1, count: 12 }, ...]
    const formattedCounts = counts.map(item => ({
      year: item._id.year,
      month: item._id.month,
      count: item.count
    }));

    res.status(200).json(formattedCounts);
  } catch (error) {
    console.error('Error fetching monthly enrollment counts:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createEnrollment,
  getAllEnrollments,
  getEnrollmentsByUserId,
  getEnrollmentById,
  deleteEnrollment,
  checkEnrollment,
  getMonthlyEnrollmentCounts
};
