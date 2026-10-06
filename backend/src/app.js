const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const Sentry = require("./config/sentry");


const authRoutes = require("./routes/auth.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const roomRoutes = require("./routes/room.routes");
const assistantRoutes = require("./routes/assistant.routes");
const adminRoutes = require("./routes/admin.routes"); // ✅ Added
const ownerRoutes = require("./routes/owner.routes"); // ✅ Added for Owner Portal
const electricityRoutes = require("./routes/electricity.routes");
const expenseRoutes = require("./routes/expense.routes");
const notificationRoutes = require("./routes/notification.routes");
const pushRoutes = require("./routes/push.routes");
const reportRoutes = require("./routes/report.routes");
const savedSearchRoutes = require("./routes/savedSearch.routes");
const paymentRoutes = require("./routes/payment.routes");
const maintenanceRoutes = require("./routes/maintenance.routes");
const loanRoutes = require("./routes/loan.routes");
const hourlyRoomManagerRoutes = require("./routes/hourlyRoomManager.routes");
const hourlyBookingRoutes = require("./routes/hourlyBooking.routes");
const laundryVendorRoutes = require("./routes/laundryVendor.routes");
const hourlyRoomRoutes = require("./routes/hourlyRoom.routes");
const vehicleRoutes = require("./routes/vehicle.routes");
const vehicleRequestRoutes = require("./routes/vehicleRequest.routes");
const serviceRoutes = require("./routes/service.routes");
const serviceBookingRoutes = require("./routes/serviceBooking.routes");
const furnitureRoutes = require("./routes/furniture.routes");
const homeSectionRoutes = require("./routes/homeSection.routes");
const roommateRoutes = require("./routes/roommate.routes");
const propertyRoutes = require("./routes/property.routes");
const furnitureRequestRoutes = require("./routes/furnitureRequest.routes");
const messRoutes = require("./routes/mess.routes");
const activityRoutes = require("./routes/activity.routes");
const sitemapRoutes = require("./routes/sitemap.routes"); // ✅ Added for SEO sitemap
const userRoutes = require("./routes/user.routes");
const villaRoutes = require("./routes/villa.routes");
const villaBookingRoutes = require("./routes/villaBooking.routes");
const socialRoutes = require("./routes/social.routes");
const donationRoutes = require("./routes/donation.routes");
const bloodRequestRoutes = require("./routes/bloodRequest.routes");
const telegramWebhookRoutes = require("./routes/telegramWebhook.routes");


const {
  notFound,
  errorHandler,
} = require("./middleware/error.middleware");



const app = express();
app.set("trust proxy", 1);




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


app.use("/api/telegram/webhook", telegramWebhookRoutes);

app.use(
  express.json()
);


app.use(
  cookieParser()
);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});












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

app.use(
  "/api/assistant",
  assistantRoutes
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
app.use("/api/push", pushRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/saved-searches", savedSearchRoutes);


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

// ✅ STUDENT LOAN ROUTES
app.use(
  "/api/loans",
  loanRoutes
);

// ✅ HOURLY ROOM MANAGER ROUTES
app.use(
  "/api/hourly-managers",
  hourlyRoomManagerRoutes
);

// ✅ HOURLY BOOKING ROUTES
app.use(
  "/api/hourly-bookings",
  hourlyBookingRoutes
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

// ✅ VEHICLE ROUTES
app.use(
  "/api/vehicles",
  vehicleRoutes
);

app.use("/api/vehicle-requests", vehicleRequestRoutes);

// ✅ SERVICE ROUTES
app.use(
  "/api/services",
  serviceRoutes
);

// ✅ SERVICE BOOKING ROUTES
app.use(
  "/api/service-bookings",
  serviceBookingRoutes
);

app.use("/api/furniture", furnitureRoutes);
app.use("/api/home-sections", homeSectionRoutes);
app.use("/api/roommates", roommateRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/furniture-requests", furnitureRequestRoutes);
app.use("/api/users", userRoutes);
app.use("/api/villas", villaRoutes);
app.use("/api/villa-bookings", villaBookingRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/blood-requests", bloodRequestRoutes);

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

if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.use(notFound);

app.use(errorHandler);

module.exports = app;
