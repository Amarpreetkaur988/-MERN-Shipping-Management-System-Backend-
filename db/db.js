const mongoose = require("mongoose");
const db = require("../config/keys").mongoURI;

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: true,
  })
  .then(() => console.log("Database connected"))
  .catch((err) => console.log("Error in database connection"));
