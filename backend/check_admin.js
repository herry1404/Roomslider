require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/user.model");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const user = await User.findOne({ email: "roomslider.in@gmail.com" }, "email role googleId authProvider");
  console.log(user);
  process.exit(0);
}).catch(err => {
  console.error("CONNECTION ERROR:", err.message);
  process.exit(1);
});
