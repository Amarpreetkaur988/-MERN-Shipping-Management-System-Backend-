const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  receiverId: {
    type: String,
    required: [true, "Receiver Id is required"],
  },
  senderId: {
    type: String,
    required: [true, "Sender Id is required"],
  },
  notificationSendTo: {
    type: String,
    trim: true,
    enum: ["manager", "staff", "captain", "admin"],
  },
  notificationTitle: {
    type: String,
    trim: true,
    required: [true, "Title is required"],
    max: [30, "Title should not be more than 30 letters"],
  },
  notificationBody: {
    type: String,
    trim: true,
    required: [true, "Body is required"],
    max: [120, "Body should not be more than 120 letters"],
  },
  isDeletedByReceiver: {
    type: Boolean,
    default: false,
  },
  notificationSendAt: {
    type: Date,
    default: Date.now(),
  },
  notificationUpdatedAt: {
    type: Date,
    default: Date.now(),
  },
  notificationReadAt: {
    type: String,
    default: "",
  },
  readStaff: {
    type: Boolean,
    default: false,
  },
  readManager: {
    type: Boolean,
    default: false,
  },
  readAdmin: {
    type: Boolean,
    default: false,
  },
});


const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
