const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema({
  value: {
    type: String,
    trim: true,
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
  updated_at: {
    type: Date,
    default: Date.now(),
  },
});

const About = mongoose.model("About", aboutSchema);

module.exports = About;
