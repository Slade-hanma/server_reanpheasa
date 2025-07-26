const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const videoSchema = new Schema({
  name: { type: String, required: true },
  duration: { type: Number }, // seconds
  size: { type: Number },     // bytes
  type: { type: String },
  url: { type: String, required: true },        // ✅ Cloudinary file URL
  public_id: { type: String, required: true },  // ✅ Cloudinary public ID for deletion
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


const moduleSchema = new Schema({
  name: { type: String, required: true },
  videos: [videoSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const courseSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  level: { type: String, required: true },
  lecturer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String },
  requirements: [{ type: String }],
  modules: [moduleSchema],
  image: { type: String }, // ✅ Add this line
}, { timestamps: true });


module.exports = mongoose.model('Course', courseSchema);
