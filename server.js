require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");;
const manager = require("./routes/manager");
const admin = require("./routes/admin");
const captain = require("./routes/captain");

// Init app
const app = express();

// Connect database
require("./db/db");

// Middleware
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));
app.use(bodyParser.json({ limit: "100mb" }));
app.use(cors());

// Static Files
app.use(express.static("uploads"));

// Config winston
require("./config/winston");

// Routes
app.use("/api/manager", manager);
app.use("/api/admin", admin);
app.use("/api/captain", captain);

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

// Connect port
const port = process.env.PORT || 6001;
app.listen(port, () => console.log(`App running on port ${port}`));
