require("winston-mongodb");
const winston = require("winston");
const keys = require("./keys");

const logger = winston.createLogger({
  level: "error",
  format: winston.format.simple(),
  transports: [new winston.transports.File({ filename: "error.log" })],
});

winston.add(logger);
// winston.add(new winston.transports.MongoDB(options));

module.exports = logger;
