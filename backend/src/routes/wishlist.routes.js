const express = require("express");

const router = express.Router();


const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} = require("../controllers/wishlist.controller");


const {
  protect
} = require("../middleware/auth.middleware");





router.post(
  "/:roomId",
  protect,
  addToWishlist
);



router.get(
  "/",
  protect,
  getWishlist
);



router.delete(
  "/:roomId",
  protect,
  removeFromWishlist
);




module.exports = router;