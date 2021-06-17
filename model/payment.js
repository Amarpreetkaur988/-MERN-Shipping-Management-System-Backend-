const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  paymentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Manager",
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
   },
  transactionId: {
    type: String,
  },
  currency: {
    type: String,
  },
  accountId: {
    type: String,
  },
  paymentIntentId: {
    type: String,
  },
  paymentAmount: {
    type: Number,
    default: 0,
  },
  paymentStatus: {
    type:String,
    default: "",
  },
  amountSendAt: {
    type: Date,
    default: Date.now(),
  },
  status: {
    type: Boolean,
    default: false
  },
});

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
