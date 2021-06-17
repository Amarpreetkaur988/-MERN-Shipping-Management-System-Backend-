const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema({
  images: {
    type: Object,
  },
  question: {
    type: String,
    trim: true,
  },
  answer: {
    type: String,
    trim: true,
  },
  views: {
    type: String,
    min: 0,
    default: 0,
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

const FAQ = mongoose.model("FAQ", faqSchema);

module.exports = FAQ;
