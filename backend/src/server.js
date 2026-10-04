const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");
const http = require("http");
const createRoommateSocket = require("./socket/roommateSocket");


const PORT = process.env.PORT || 5000;


// ======================
// Database Connection
// ======================

connectDB();



// ======================
// Start Server
// ======================

const server = http.createServer(app);
const io = createRoommateSocket(server);
app.set("io", io);

server.listen(PORT, "0.0.0.0", () => {

  console.log(
    `🚀 RoomSlider Backend running on port ${PORT}`
  );

  console.log(
    `🌐 Local: http://localhost:${PORT}`
  );

});