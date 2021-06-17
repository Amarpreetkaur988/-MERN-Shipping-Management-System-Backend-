const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  categorySection: {
    type: String,
  },
  categoryName: {
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

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
