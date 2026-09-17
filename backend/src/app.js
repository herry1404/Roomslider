const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");


const authRoutes = require("./routes/auth.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const roomRoutes = require("./routes/room.routes");
const adminRoutes = require("./routes/admin.routes"); // ✅ Added
const ownerRoutes = require("./routes/owner.routes"); // ✅ Added for Owner Portal
const electricityRoutes = require("./routes/electricity.routes");
const expenseRoutes = require("./routes/expense.routes");
const notificationRoutes = require("./routes/notification.routes");
const paymentRoutes = require("./routes/payment.routes");
const maintenanceRoutes = require("./routes/maintenance.routes");
const laundryVendorRoutes = require("./routes/laundryVendor.routes");
const hourlyRoomRoutes = require("./routes/hourlyRoom.routes");
const messRoutes = require("./routes/mess.routes");
const activityRoutes = require("./routes/activity.routes");
const sitemapRoutes = require("./routes/sitemap.routes"); // ✅ Added for SEO sitemap


const {
  notFound,
  errorHandler,
} = require("./middleware/error.middleware");



const app = express();




// =====================
// Security
// =====================

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);





// =====================
// CORS
// =====================

app.use(
  cors({

    origin: function(origin, callback){

      if(!origin){

        return callback(null, true);

      }


      if(
        origin.includes("localhost")
      ){

        return callback(null,true);

      }


      if(
        origin.includes("192.168.")
      ){

        return callback(null,true);

      }


      if(
        origin.includes("100.115.")
      ){

        return callback(null,true);

      }


      if(
        origin.includes("ngrok")
      ){

        return callback(null,true);

      }



      if(
        origin.includes("vercel.app")
      ){

        return callback(null,true);

      }


      if(
        origin.includes("roomslider.in")
      ){

        return callback(null,true);

      }

      return callback(new Error("Not allowed by CORS"));

    },


    credentials:true,

  })
);







// =====================
// Logger
// =====================

if(process.env.NODE_ENV !== "production"){

  app.use(
    morgan("dev")
  );

}






// =====================
// Middleware
// =====================


app.use(
  express.json()
);


app.use(
  cookieParser()
);













// =====================
// Routes
// =====================


app.use(
  "/api/auth",
  authRoutes
);



app.use(
  "/api/wishlist",
  wishlistRoutes
);



app.use(
  "/api/rooms",
  roomRoutes
);


// ✅ SUPER ADMIN ROUTES
app.use(
  "/api/admin",
  adminRoutes
);


// ✅ OWNER PORTAL ROUTES
app.use(
  "/api/owners",
  ownerRoutes
);


// ✅ MESS ROUTES
app.use(
  "/api/mess",
  messRoutes
);


// ✅ ELECTRICITY BILLING ROUTES
app.use(
  "/api/electricity",
  electricityRoutes
);


// ✅ EXPENSE TRACKING ROUTES
app.use(
  "/api/expenses",
  expenseRoutes
);


// ✅ NOTIFICATION ROUTES
app.use(
  "/api/notifications",
  notificationRoutes
);


// ✅ PAYMENT ROUTES
app.use(
  "/api/payments",
  paymentRoutes
);

// ✅ MAINTENANCE ROUTES
app.use(
  "/api/maintenance",
  maintenanceRoutes
);

// ✅ LAUNDRY VENDOR ROUTES
app.use(
  "/api/laundry-vendors",
  laundryVendorRoutes
);

// ✅ ACTIVITY LOG ROUTES
app.use(
  "/api/activity",
  activityRoutes
);

// ✅ HOURLY ROOMS ROUTES
app.use(
  "/api/hourly-rooms",
  hourlyRoomRoutes
);

// ✅ SITEMAP ROUTE (for SEO)
app.use(
  "/sitemap.xml",
  sitemapRoutes
);







// =====================
// Health Check
// =====================


app.get("/",(req,res)=>{


  res.status(200).json({

    success:true,

    message:
    "RoomSlider API is running 🚀",

  });


});








// =====================
// Error Handling
// =====================


app.use(notFound);

app.use(errorHandler);

module.exports = app;
