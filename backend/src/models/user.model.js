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
      unique: true,
      sparse: true,
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

    // The room this user is currently renting as a tenant (set when an
    // owner assigns them to a room, cleared on vacate)
    activeRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },

    // Preferred college and area, set via onboarding popup, used to
    // order/label rooms on the map by distance from this reference point
    preferredCollege: {
      type: String,
      default: null,
    },

    preferredArea: {
      type: String,
      default: null,
    },


  },
  {
    timestamps: true,
  }
);


module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);