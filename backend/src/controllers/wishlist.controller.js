const User = require("../models/user.model");
const Room = require("../models/room.model");



// ADD TO WISHLIST

const addToWishlist = async (req, res) => {

  try {


    const { roomId } = req.params;



    const room = await Room.findById(roomId);


    if (!room) {

      return res.status(404).json({

        success:false,

        message:"Room not found",

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




    const alreadyAdded =
      user.wishlist.some(
        id => id.toString() === roomId
      );



    if(alreadyAdded){

      return res.status(400).json({

        success:false,

        message:"Already in wishlist",

      });

    }




    user.wishlist.push(room._id);


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
    .populate("wishlist");



    if(!user){

      return res.status(404).json({

        success:false,

        message:"User not found",

      });

    }



    res.status(200).json({

      success:true,

      wishlist:user.wishlist,

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