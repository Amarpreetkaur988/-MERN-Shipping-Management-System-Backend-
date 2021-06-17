const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema({
  managerId: {
   type: String,
  },
  vesselId: {
    type: String,
  },
  title: {
    type: String,
  },
  date: {
    type: String,
  },
  time: {
    type: String,
  },
  message: {
    type: String,
  },
  status: {
    type: Boolean,
    default: false,
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

const Reminder = mongoose.model("Reminder", reminderSchema);

module.exports = Reminder;
