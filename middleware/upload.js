// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
// if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, UPLOAD_DIR),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, file.fieldname + '-' + Date.now() + ext);
//   },
// });

// const upload = multer({ storage });

// module.exports = upload;


const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;
