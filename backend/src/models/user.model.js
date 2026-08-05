const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // USER / ADMIN CONTROL
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },


    // Wishlist Rooms
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
      },
    ],


  },
  {
    timestamps: true,
  }
);


module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);