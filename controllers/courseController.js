const Course = require('../models/courseModel');
const mongoose = require('mongoose');

const cloudinary = require('../config/cloudinaryConfig');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCourse = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(404).json({ error: 'Invalid course id' });

  try {
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const {
      name,
      price,
      discount,
      level,
      lecturer,
      description,
      requirements,
      modules: modulesFromClient,
    } = req.body;

    const files = req.files || []; // multer.memoryStorage()

    // 1. Upload course thumbnail image (if any)
    let courseImageUrl = '';
    const courseImageFile = files.find(f => f.fieldname === 'image');
    if (courseImageFile) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(courseImageFile.buffer);
      });
      courseImageUrl = uploadResult.secure_url;
    }

    // 2. Parse modules JSON
    let modulesParsed = [];
    try {
      modulesParsed =
        typeof modulesFromClient === 'string'
          ? JSON.parse(modulesFromClient)
          : modulesFromClient || [];
      if (!Array.isArray(modulesParsed)) {
        return res.status(400).json({ error: 'Modules must be an array' });
      }
    } catch {
      return res.status(400).json({ error: 'Invalid modules JSON' });
    }

    // 3. Prepare modules with uploaded videos/images
    const modules = [];

    for (let i = 0; i < modulesParsed.length; i++) {
      const mod = modulesParsed[i];
      if (!mod.videos || !Array.isArray(mod.videos)) {
        return res.status(400).json({ error: `Videos missing or invalid in module ${mod.name}` });
      }

      const videos = [];

      for (let j = 0; j < mod.videos.length; j++) {
        const video = mod.videos[j];

        // Match uploaded file by original name
        const file = files.find((f) => f.originalname === video.name);
        if (!file) {
          return res.status(400).json({ error: `File not found for video/image: ${video.name}` });
        }

        // Determine Cloudinary resource type
        let resourceType = 'video';
        if (file.mimetype.startsWith('image/')) {
          resourceType = 'image';
        }

        // Upload file buffer to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: resourceType },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(file.buffer);
        });

        // Push video/image metadata
        videos.push({
          name: video.name,
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
          duration: video.duration || null,
          size: file.size,
          type: file.mimetype,
        });
      }

      // Add this module with uploaded videos
      modules.push({
        name: mod.name,
        videos,
      });
    }

    // 4. Create and save the course document
    const newCourse = await Course.create({
      name,
      price: parseFloat(price),
      discount: parseFloat(discount),
      level,
      lecturer,
      description,
      requirements: requirements ? JSON.parse(requirements) : [],
      image: courseImageUrl, // Course thumbnail image URL
      modules,
    });

    res.status(201).json({ message: 'Course created', data: newCourse });
  } catch (err) {
    console.error('Create course error:', err);
    res.status(400).json({ error: err.message });
  }
};




const deleteCourse = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(404).json({ error: 'Invalid course id' });

  try {
    const course = await Course.findByIdAndDelete(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Optional: Delete course thumbnail from Cloudinary
    if (course.image && typeof course.image === 'string' && course.image.trim() !== '') {
      try {
        const publicId = extractPublicIdFromUrl(course.image);
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.warn('Failed to delete image from Cloudinary:', err.message);
      }
    }

    // Optional: Delete all Cloudinary videos in modules
    for (const mod of course.modules) {
      for (const video of mod.videos) {
        if (video.public_id) {
          try {
            await cloudinary.uploader.destroy(video.public_id, { resource_type: 'video' });
          } catch (err) {
            console.warn(`Failed to delete video ${video.name}:`, err.message);
          }
        }
      }
    }

    res.status(200).json({ message: 'Course deleted' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper to extract public_id from Cloudinary URL
function extractPublicIdFromUrl(url) {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1]; // e.g., abc123.mp4
  return fileName.split('.')[0]; // remove file extension
}


const updateCourse = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(404).json({ error: 'Invalid course id' });

  try {
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Parse requirements from JSON string if needed
    let requirements = [];
    if (req.body.requirements) {
      try {
        requirements = typeof req.body.requirements === 'string'
          ? JSON.parse(req.body.requirements)
          : req.body.requirements;
      } catch {
        return res.status(400).json({ error: 'Invalid JSON for requirements' });
      }
    }

    // Parse modules from JSON string if needed
    let modules = [];
    if (req.body.modules) {
      try {
        modules = typeof req.body.modules === 'string'
          ? JSON.parse(req.body.modules)
          : req.body.modules;
      } catch {
        return res.status(400).json({ error: 'Invalid JSON for modules' });
      }
    }

    // Attach uploaded files to corresponding videos
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.fieldname === 'image') return; // skip image for now

        const match = file.fieldname.match(/^modules\[(\d+)\]\[videos\]\[(\d+)\]\[file\]$/);
        if (match) {
          const moduleIndex = parseInt(match[1], 10);
          const videoIndex = parseInt(match[2], 10);

          if (modules[moduleIndex]?.videos?.[videoIndex]) {
            modules[moduleIndex].videos[videoIndex] = {
              ...modules[moduleIndex].videos[videoIndex],
              name: file.originalname,
              filename: file.filename,
              size: file.size,
              type: file.mimetype,
              updatedAt: new Date(),
              url: `/uploads/${file.filename}`,
            };
          }
        }
      });
    }

    // Preserve existing video info for videos with URLs but no new files
    modules.forEach((mod, modIndex) => {
      mod.videos.forEach((video, vidIndex) => {
        if (!video.filename && video.url) {
          const existingVideo = course.modules?.[modIndex]?.videos?.[vidIndex];
          if (existingVideo) {
            mod.videos[vidIndex] = {
              ...existingVideo.toObject(),
              ...video,
              updatedAt: new Date(),
            };
          }
        }
      });
    });

    // Update course fields
    course.name = req.body.name || course.name;
    course.price = req.body.price ? parseFloat(req.body.price) : course.price;
    course.discount = req.body.discount ? parseFloat(req.body.discount) : course.discount;
    course.level = req.body.level || course.level;
    course.lecturer = req.body.lecturer || course.lecturer;
    course.description = req.body.description || course.description;
    course.requirements = requirements.length ? requirements : course.requirements;
    course.modules = modules.length ? modules : course.modules;

    // Update course image if uploaded
    const imageFile = req.files.find(f => f.fieldname === 'image');
    if (imageFile) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(imageFile.buffer);
      });

      course.image = uploadResult.secure_url;  // Store Cloudinary URL instead
    }


    await course.save();

    res.status(200).json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(400).json({ error: error.message });
  }
};




// You can **keep** addModule if you want modules added separately later, otherwise you can remove it:
const addModule = async (req, res) => {
  const { id } = req.params; // course id
  const { name } = req.body;
  if (!isValidId(id)) return res.status(404).json({ error: 'Invalid course id' });
  if (!name) return res.status(400).json({ error: 'Module name required' });

  try {
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    course.modules.push({ name, videos: [] });
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload video file to module (if you still want to upload videos separately)
const uploadVideoToModule = async (req, res) => {
  const { courseId, moduleId } = req.params;
  if (!isValidId(courseId) || !isValidId(moduleId))
    return res.status(404).json({ error: 'Invalid course or module id' });

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const mod = course.modules.id(moduleId);
    if (!mod) return res.status(404).json({ error: 'Module not found' });

    const duration = req.body.duration ? Number(req.body.duration) : undefined;

    mod.videos.push({
      name: req.body.name || req.file.originalname,
      duration,
      size: req.file.size,
      type: req.file.mimetype,
      filename: req.file.filename,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await course.save();
    res.status(201).json(mod.videos[mod.videos.length - 1]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeVideoFromModule = async (req, res) => {
  const { courseId, moduleId, videoId } = req.params;
  if (!isValidId(courseId) || !isValidId(moduleId) || !isValidId(videoId))
    return res.status(404).json({ error: 'Invalid ID(s)' });

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const mod = course.modules.id(moduleId);
    if (!mod) return res.status(404).json({ error: 'Module not found' });

    const video = mod.videos.id(videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    // Delete file from disk
    const filepath = path.join(__dirname, '..', 'uploads', video.filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    video.remove();
    await course.save();

    res.status(200).json({ message: 'Video deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCourseCount = async (req, res) => {
  try {
    const count = await Course.countDocuments({});
    res.status(200).json({ totalCourses: count });
  } catch (error) {
    console.error('Error getting course count:', error);
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  getCourses,
  getCourse,
  createCourse,
  deleteCourse,
  updateCourse,
  addModule,
  uploadVideoToModule,
  removeVideoFromModule,
  getCourseCount
};
