const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  image: {
    type: String,
  },
  title: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  
  status: {
    type: String,
    enum: ["Active", "Inactive"],
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

const BLOG = mongoose.model("BLOG", blogSchema);

module.exports = BLOG;
