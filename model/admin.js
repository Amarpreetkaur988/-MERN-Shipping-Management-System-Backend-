const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  firstName: {
    type: String,
    minlength: 3,
    maxlength: 255,
    trim: true,
  },
  lastName: {
    type: String,
    minlength: 3,
    maxlength: 255,
    trim: true,
  },
  email: {
    type: String,
    maxlength: 255,
    trim: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
  },
  phoneNumber: {
    type: String,
    minlength: 10,
    maxlength: 13,
  },
  isPhoneNumberVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
  password: {
    type: String,
  },
  image: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
  },
  language: {
    type: String,
    trim: true,
  },
  forgotPassword: {
    token: String,
    validTill: String,
  },
  commissionAmount: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
});

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
