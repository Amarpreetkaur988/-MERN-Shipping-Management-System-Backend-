require("dotenv").config();

module.exports = {
  mongoURI: "mongodb://localhost:27017/shipmanager",
  apiURL: "http://shipmanager.alcax.com:6001/",
  fixerAPI_KEY: process.env.FIXER_API_KEY,
  secretOrKey: process.env.SECRET_OR_KEY,
  nodeENV: process.env.NODE_ENV,
  clientPath: process.env.CLIENT_PATH,
  serverPath: process.env.SERVER_PATH,
  senderEmail: process.env.SENDER_EMAIL,
  senderPassword: process.env.SENDER_PASS,
  senderHost: process.env.SENDER_HOST,
  senderUsername: process.env.SENDER_USERNAME,
};
