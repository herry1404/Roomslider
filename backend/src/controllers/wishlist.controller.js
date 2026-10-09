const User = require("../models/user.model");
const Room = require("../models/room.model");
const HourlyRoom = require("../models/HourlyRoom.model");
const Villa = require("../models/Villa");



// ADD TO WISHLIST

const addToWishlist = async (req, res) => {

  try {


    const { roomId } = req.params;



    const room = await Room.findById(roomId);
    const hourlyRoom = room ? null : await HourlyRoom.findById(roomId);
    const villa = room || hourlyRoom ? null : await Villa.findById(roomId);
    if (!room && !hourlyRoom && !villa) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }




    const user = await User.findById(
      req.user._id
    );



    if(!user){

      return res.status(404).json({

        success:false,

        message:"User not found",

      });

    }




    const wishlist = room ? user.wishlist : hourlyRoom ? user.hourlyWishlist : user.villaWishlist;
    const alreadyAdded = wishlist.some((id) => id.toString() === roomId);



    if(alreadyAdded){

      return res.status(400).json({

        success:false,

        message:"Already in wishlist",

      });

    }




    wishlist.push(room?._id || hourlyRoom?._id || villa._id);


    await user.save();




    res.status(200).json({

      success:true,

      message:"Added to wishlist ❤️",

    });



  } catch(error){


    res.status(500).json({

      success:false,

      message:error.message,

    });


  }

};







// GET WISHLIST

const getWishlist = async(req,res)=>{


  try{


    const user = await User.findById(
      req.user._id
    )
    .populate("wishlist")
    .populate("hourlyWishlist")
    .populate("villaWishlist");



    if(!user){

      return res.status(404).json({

        success:false,

        message:"User not found",

      });

    }



    res.status(200).json({

      success:true,
      wishlist: [
        ...user.wishlist.filter(Boolean).map((room) => ({ ...room.toObject(), listingType: "room" })),
        ...user.hourlyWishlist.filter(Boolean).map((room) => ({ ...room.toObject(), listingType: "hourly" })),
        ...user.villaWishlist.filter(Boolean).map((villa) => ({ ...villa.toObject(), listingType: "villa" })),
      ],

    });



  }catch(error){


    res.status(500).json({

      success:false,

      message:error.message,

    });


  }


};







// REMOVE FROM WISHLIST


const removeFromWishlist = async(req,res)=>{


  try{


    const { roomId } = req.params;



    const user = await User.findById(
      req.user._id
    );



    if(!user){

      return res.status(404).json({

        success:false,

        message:"User not found",

      });

    }




    user.wishlist =
      user.wishlist.filter(

        id => id.toString() !== roomId

      );
    user.hourlyWishlist = user.hourlyWishlist.filter(
      (id) => id.toString() !== roomId
    );
    user.villaWishlist = user.villaWishlist.filter(
      (id) => id.toString() !== roomId
    );




    await user.save();




    res.status(200).json({

      success:true,

      message:"Removed from wishlist",

    });




  }catch(error){


    res.status(500).json({

      success:false,

      message:error.message,

    });


  }


};





module.exports = {

  addToWishlist,

  getWishlist,

  removeFromWishlist,

};