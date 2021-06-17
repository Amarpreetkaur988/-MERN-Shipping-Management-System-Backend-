const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  type: {
    type: Number,
  },
  body: {
    type: String,
  },
  title: {
    type: String,
  },
  link: {
    type: String,
    default: null
  }
});

const customNotificationSchema = new mongoose.Schema({
  customNotification: [notificationSchema],
  created_at: {
    type: Date,
    default: Date.now(),
  },
});

const CustomNotification = mongoose.model("CustomNotification", customNotificationSchema);

module.exports = CustomNotification;
