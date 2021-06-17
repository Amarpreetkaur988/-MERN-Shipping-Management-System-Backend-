const express = require("express");
const router = express.Router();
const captainController = require("../controller/captainController");
const middlewares = require("../middleware/fun");
 const upload = require("../middleware/multer");

// const facebookAuth = passport.authenticate("facebook");

/* -------------------------------------------------------------------------------- */

// Auth

// router.post("/signup", captainController.signup);
router.post(
"/get/captainById",

captainController.getCaptainById);

module.exports = router;