require("dotenv").config();
const jwt = require("jsonwebtoken");
const winston = require("winston");
const keys = require("../config/keys");
// const Subscription = require("../model/subscriptions");

module.exports = middlewares = {
  authenticateToken: async (req, res, next) => {
    try {
      if (!req.headers["x-access-token"]) {
        return res.status(401).json({
          error: "Key x-access-token not found",
        });
      }
      if (req.headers["x-access-token"] === "") {
        return res.status(401).json({
          error: "Token not found",
        });
      }
      const token = req.headers["x-access-token"];
      const data = await jwt.verify(token, keys.secretOrKey);
      if (!data) return res.status(401).json({ error: "Invalid token" });
      req.data = data;
      next();
    } catch (err) {
      winston.error(err.message);
      return res.status(400).json({ error: err.message });
    }
  },
  checkSubscription: async (req, res, next) => {
    const subscriptions = await Subscription.find({}).exec();
    const flag = false;
    const accountType = req.headers["role"];
    if (accountType === "manager") {
      const isUser = await Manager
        .findOne(
            { _id: req.data.userId},
        )
        .exec();
      if (!isUser) {
        return next(new Error("User not found"));
      }

      if (subscriptions.length > 0) {
        subscriptions.forEach((subscription) => {
          if (subscription.user_id.toString() === isUser._id.toString()) {
            flag = true;

            const is_sub_expired = moment().isAfter(subscription.validTill);
            if (is_sub_expired) {
              return res.status(401).json({
                responseCode: 401,
                responseMessage: "Your subscription is expired",
              });
            }
          }
        });
      }

      if (!flag)
        return res.status(401).json({
          responseCode: 401,
          responseMessage: "You have not purchased any subscription",
        });
    }
  },
};

