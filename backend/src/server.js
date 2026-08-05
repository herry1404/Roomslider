const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");


const PORT = process.env.PORT || 5000;


// ======================
// Database Connection
// ======================

connectDB();



// ======================
// Start Server
// ======================

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    `🚀 RoomSlider Backend running on port ${PORT}`
  );

  console.log(
    `🌐 Local: http://localhost:${PORT}`
  );

});