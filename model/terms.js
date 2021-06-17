const mongoose = require("mongoose");

const termSchema = new mongoose.Schema({
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

const Term = mongoose.model("Term", termSchema);

module.exports = Term;
