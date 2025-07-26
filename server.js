require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const paypal = require('paypal-rest-sdk');
const courseRoutes = require('./routes/courseRoute');
const userRoutes = require('./routes/userRoute');
const enrollmentRoutes = require('./routes/enrollmentRoute');
const userInfoRoutes = require('./routes/userInfoRoutes');
const paymentRoutes = require('./routes/paymentRoutes');


const app = express();
const cors = require('cors');
app.use(cors());

// Ensure uploads folder exists (optional, already handled in upload middleware)
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));

// Logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});


paypal.configure({
  mode: 'sandbox',
  client_id: 'YOUR_PAYPAL_CLIENT_ID',
  client_secret: 'YOUR_PAYPAL_CLIENT_SECRET',
});

// Routes
app.use('/api/paypal', paymentRoutes);

// Routes
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/user-info', userInfoRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 4000;
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ DB connection error:', err));
