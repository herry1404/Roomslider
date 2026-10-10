const User = require("../models/user.model");
const Room = require("../models/room.model");
const Owner = require("../models/Owner");
const SearchEvent = require("../models/SearchEvent");
const PushHistory = require("../models/PushHistory");
const ListingEngagement = require("../models/ListingEngagement");


// ===============================
// Dashboard
// ===============================

const getDashboard = async (req, res) => {
  try {

    const totalRooms = await Room.countDocuments();

    const totalUsers = await User.countDocuments({
      role: "user",
    });

    const totalAdmins = await User.countDocuments({
      role: "admin",
    });

    const totalOwners = await Owner.countDocuments();


    const users = await User.find({}, "wishlist");


    let totalWishlist = 0;


    users.forEach((user) => {

      totalWishlist += user.wishlist?.length || 0;

    });


    // ---- New Users This Week ----
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const newUsersThisWeek = await User.countDocuments({
      role: "user",
      createdAt: { $gte: oneWeekAgo },
    });


    // ---- Listings Growth (cumulative, last 6 months) + Total Views + Total Earnings ----
    const rooms = await Room.find({}, "createdAt location views occupancyHistory");

    const monthLabels = [];
    const monthBuckets = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(d.toLocaleString("en-US", { month: "short" }));
      const cutoff = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      monthBuckets.push(cutoff);
    }

    const listingsGrowth = monthBuckets.map((cutoff, idx) => ({
      month: monthLabels[idx],
      total: rooms.filter((r) => new Date(r.createdAt) < cutoff).length,
    }));


    // ---- Demand by Locality (top 5, by listing count) ----
    const localityCounts = {};

    rooms.forEach((r) => {
      const loc = (r.location || "Unknown").trim();
      localityCounts[loc] = (localityCounts[loc] || 0) + 1;
    });

    const localityDemand = Object.entries(localityCounts)
      .map(([locality, count]) => ({ locality, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);


    // ---- Total Views (sum across all rooms) ----
    let totalViews = 0;

    rooms.forEach((r) => {
      totalViews += r.views || 0;
    });


    // ---- Total Earnings (sum of totalPaid across all occupancy history entries) ----
    let totalEarnings = 0;

    rooms.forEach((r) => {
      (r.occupancyHistory || []).forEach((entry) => {
        totalEarnings += entry.totalPaid || 0;
      });
    });


    res.status(200).json({

      success: true,

      stats: {
        totalRooms,
        totalUsers,
        totalAdmins,
        totalOwners,
        totalWishlist,
        newUsersThisWeek,
        listingsGrowth,
        localityDemand,
        totalViews,
        totalEarnings,
      },

    });


  } catch (error) {

    res.status(500).json({

      success:false,

      message:error.message,

    });

  }
};

const getAnalytics = async (req, res) => {
  try {
    const indiaDateParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const todayParts = Object.fromEntries(
      indiaDateParts
        .filter((part) => part.type !== "literal")
        .map(({ type, value }) => [type, Number(value)])
    );
    const todayStart = new Date(Date.UTC(
      todayParts.year,
      todayParts.month - 1,
      todayParts.day
    ) - (5 * 60 + 30) * 60 * 1000);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 29);
    start.setUTCHours(0, 0, 0, 0);

    const dateGroup = {
      $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
    };
    const [signups, searches, topAreas, listingsByCategory, pushSentCount, todayViews] = await Promise.all([
      User.aggregate([
        { $match: { role: "user", createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: dateGroup, count: { $sum: 1 } } },
      ]),
      SearchEvent.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: dateGroup, count: { $sum: 1 } } },
      ]),
      Room.aggregate([
        { $group: { _id: "$location", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 8 },
      ]),
      Room.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      PushHistory.countDocuments(),
      ListingEngagement.countDocuments({
        type: "view",
        createdAt: { $gte: todayStart, $lt: tomorrowStart },
      }),
    ]);

    const signupCounts = new Map(signups.map((item) => [item._id, item.count]));
    const searchCounts = new Map(searches.map((item) => [item._id, item.count]));
    const dailyActivity = [];
    for (let offset = 0; offset < 30; offset += 1) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + offset);
      const key = date.toISOString().slice(0, 10);
      dailyActivity.push({
        date: key,
        signups: signupCounts.get(key) || 0,
        searches: searchCounts.get(key) || 0,
      });
    }

    return res.status(200).json({
      success: true,
      analytics: {
        dailyActivity,
        topAreas: topAreas.map((item) => ({ area: item._id || "Unknown", count: item.count })),
        listingsByCategory: listingsByCategory.map((item) => ({
          category: item._id || "Uncategorized",
          count: item.count,
        })),
        pushSentCount,
        todayViews,
      },
    });
  } catch (error) {
    console.error("ADMIN ANALYTICS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};




// ===============================
// Get All Users
// ===============================

const getAllUsers = async (req,res)=>{

  try {


    const users = await User.find()
      .select("-password")
      .sort({
        createdAt:-1,
      });



    res.status(200).json({

      success:true,

      users,

    });



  } catch(error){


    res.status(500).json({

      success:false,

      message:error.message,

    });


  }

};




// ===============================
// Delete User
// ===============================

const deleteUser = async(req,res)=>{

  try {


    const user = await User.findById(
      req.params.id
    );


    if(!user){

      return res.status(404).json({

        success:false,

        message:"User not found",

      });

    }


    if(user.role === "admin"){

      return res.status(403).json({

        success:false,

        message:"Admin accounts cannot be deleted",

      });

    }



    await User.findByIdAndDelete(
      req.params.id
    );



    res.status(200).json({

      success:true,

      message:"User deleted successfully",

    });



  } catch(error){


    res.status(500).json({

      success:false,

      message:error.message,

    });


  }

};





module.exports = {

  getDashboard,
  getAnalytics,

  getAllUsers,

  deleteUser,

};
