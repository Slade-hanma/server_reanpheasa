const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt')


const userSchema = new mongoose.Schema({
  firstName: { type: String,  },
  lastName: { type: String,  },
  dateOfBirth: { type: Date },
  sex: { type: String, enum: ['Male', 'Female', 'Other'] },
  phoneNumber: { type: String },
  city: { type: String },
  country: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String },
  image: { type: String }, // ✅ New field
}, { timestamps: true });

// static signup method
userSchema.statics.signup = async function(
  firstName,
  lastName,
  dateOfBirth,
  sex,
  phoneNumber,
  city,
  country,
  email,
  password,
  role,
  image
) {
  if (!email || !password) {
    throw Error('Email and password must be provided');
  }

  if (!validator.isEmail(email)) {
    throw Error('Email not valid');
  }

  if (!validator.isStrongPassword(password)) {
    throw Error('Password not strong enough');
  }

  const exists = await this.findOne({ email });

  if (exists) {
    throw Error('Email already in use');
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await this.create({
    firstName,
    lastName,
    dateOfBirth,
    sex,
    phoneNumber,
    city,
    country,
    email,
    password: hash,
    role,
    image
  });

  return user;
};


// static login method
userSchema.statics.login = async function(email, password) {

  if (!email || !password) {
    throw Error('All fields must be filled')
  }

  const user = await this.findOne({ email })
  if (!user) {
    throw Error('Incorrect email')
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    throw Error('Incorrect password')
  }
  // if (user.password !== password) {
  //   throw Error('Incorrect password');
  // }

  return user
}
module.exports = mongoose.model('User', userSchema);
