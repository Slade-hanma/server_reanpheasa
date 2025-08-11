const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');

const {
  getCourses,
  getCourse,
  createCourse,
  deleteCourse,
  updateCourse,
  addModule,
  uploadVideoToModule,
  removeVideoFromModule,
  getCourseCount
} = require('../controllers/courseController');


router.get('/count', getCourseCount);


router.get('/', getCourses);
router.post('/', upload.any(), createCourse);
router.get('/:id', getCourse);
router.put('/:id', upload.any(), updateCourse);
router.delete('/:id', deleteCourse);

router.post('/:id/modules', addModule);

router.post(
  '/:courseId/modules/:moduleId/videos',
  upload.single('video'),
  uploadVideoToModule
);

router.delete(
  '/:courseId/modules/:moduleId/videos/:videoId',
  removeVideoFromModule
);



module.exports = router;
