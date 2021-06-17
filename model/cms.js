const mongoose = require("mongoose");

const cmsSchema = new mongoose.Schema({
  faq: [
    {
      question: String,
      answer: String,
      status: String,
      created_at: {
        type: Date,
        default: Date.now(),
      },
    },
  ],
  about: String,
  terms: String,
  policy: String,
  help: String,
});

const CMS = mongoose.model("CMS", cmsSchema);

module.exports = CMS;
