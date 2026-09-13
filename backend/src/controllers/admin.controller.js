const User = require("../models/user.model");
const Room = require("../models/room.model");
const Owner = require("../models/Owner");


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

  getAllUsers,

  deleteUser,

};
