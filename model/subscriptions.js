const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Manager",
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
  },
  purchasedFrom: {
    type: String,
  },
  packageName: {
    type: String,
  },
  datePurchased: {
    type: String,
  },
  validTill: {
    type: String,
  },
  token: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Active", "Expired"],
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
});

const Subscription = mongoose.model("Subscription", schema);

module.exports = Subscription;