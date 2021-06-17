const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  planName: {
    type: String,
    trim: true,
  },
  amount: {
    type: Number,
    min: 0,
  },
  duration: {
    type: String,
    enum: ["1", "6", "12"],
  },
  text: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
  },
  purchaseStatus: {
    type: String,
    enum: ["purchased", "pending", "cancelled"],
  },
  purchasedByManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Manager",
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

const Plan = mongoose.model("Plan", planSchema);

module.exports = Plan;
