const User = require("../models/user.model");
const Room = require("../models/room.model");


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


    const users = await User.find({}, "wishlist");


    let totalWishlist = 0;


    users.forEach((user) => {

      totalWishlist += user.wishlist?.length || 0;

    });



    res.status(200).json({

      success: true,

      stats: {
        totalRooms,
        totalUsers,
        totalAdmins,
        totalWishlist,
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