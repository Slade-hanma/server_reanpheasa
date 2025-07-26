const Course = require('../models/courseModel');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const streamifier = require('streamifier');

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

const uploadToCloudinary = (fileBuffer, resourceType = 'video') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};


const createCourse = async (req, res) => {
  try {
    const {
      name,
      price,
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

    // Delete video files from disk
    course.modules.forEach(mod => {
      mod.videos.forEach(video => {
        const filepath = path.join(__dirname, '..', 'uploads', video.filename);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      });
    });

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCourse = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(404).json({ error: 'Invalid course id' });

  try {
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Parse requirements and modules safely
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

    // Attach uploaded files to corresponding videos in modules
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.fieldname === 'image') return; // skip course image here

        const match = file.fieldname.match(/^modules\[(\d+)\]\[videos\]\[(\d+)\]\[file\]$/);
        if (match) {
          const moduleIndex = parseInt(match[1], 10);
          const videoIndex = parseInt(match[2], 10);
          if (modules[moduleIndex] && modules[moduleIndex].videos && modules[moduleIndex].videos[videoIndex]) {
            modules[moduleIndex].videos[videoIndex].filename = file.filename;
            modules[moduleIndex].videos[videoIndex].size = file.size;
            modules[moduleIndex].videos[videoIndex].type = file.mimetype;
            modules[moduleIndex].videos[videoIndex].createdAt = new Date();
            modules[moduleIndex].videos[videoIndex].updatedAt = new Date();
          }
        }
      });
    }

    // For videos missing filename (existing videos without new upload), preserve filename from existing course data
    modules.forEach((mod, modIndex) => {
      mod.videos.forEach((video, vidIndex) => {
        if (!video.filename) {
          // Try to find existing filename from DB
          const existingVideo = course.modules?.[modIndex]?.videos?.[vidIndex];
          if (existingVideo && existingVideo.filename) {
            video.filename = existingVideo.filename;
            video.size = existingVideo.size;
            video.type = existingVideo.type;
            video.createdAt = existingVideo.createdAt;
            video.updatedAt = new Date();
          } else {
            // no filename at all — handle as error or default
          }
        }
      });
    });

    // Update course fields
    course.name = req.body.name || course.name;
    course.price = req.body.price ? parseFloat(req.body.price) : course.price;
    course.level = req.body.level || course.level;
    course.lecturer = req.body.lecturer || course.lecturer;
    course.description = req.body.description || course.description;
    course.requirements = requirements.length ? requirements : course.requirements;
    course.modules = modules.length ? modules : course.modules;

    // Update course image if new uploaded
    const imageFile = req.files.find(f => f.fieldname === 'image');
    if (imageFile) {
      course.image = `/uploads/${imageFile.filename}`;
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

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  deleteCourse,
  updateCourse,
  addModule,
  uploadVideoToModule,
  removeVideoFromModule,
};
