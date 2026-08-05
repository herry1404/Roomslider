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
      required: function(){ return !this.googleId; },
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
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