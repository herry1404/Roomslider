const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    deposit: {
      type: Number,
      default: 0,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    latitude: {
      type: Number,
    },

    longitude: {
      type: Number,
    },

    images: [
      {
        type: String,
        required: true,
      },
    ],

    description: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      enum: ["Room", "PG", "Hostel", "Flat"],
      default: "Room",
    },

    rooms: {
      type: Number,
      default: 1,
    },

    bathrooms: {
      type: Number,
      default: 1,
    },

    furnished: {
      type: Boolean,
      default: false,
    },

    ownerName: {
      type: String,
      default: "",
    },

    contact: {
      type: String,
      default: "",
    },

    whatsapp: {
      type: String,
      default: "",
    },

    amenities: [
      {
        type: String,
      },
    ],

    nearby: [
      {
        type: String,
      },
    ],

    // ---- NEW FIELDS FOR OWNER PORTAL ----

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      default: null,
    },

    roomNumber: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["vacant", "occupied"],
      default: "vacant",
    },

    currentTenant: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      moveInDate: { type: Date },
      advanceAmount: { type: Number, default: 0 },
      // The date the current/next rent cycle is due. Advances by 1 month
      // each time a payment is recorded. Used to compute live paid/pending/overdue status.
      nextDueDate: { type: Date },
    },

    // Links this room to an actual registered User account (for Tenant Portal login)
    currentTenantUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "overdue"],
      default: "pending",
    },

    occupancyHistory: [
      {
        tenantName: String,
        startDate: Date,
        endDate: Date,
        totalPaid: { type: Number, default: 0 },
        payments: [
          {
            amount: Number,
            date: { type: Date, default: Date.now },
            method: String,
          },
        ],
      },
    ],

    // ---- END NEW FIELDS ----

    // Super Admin ordering - chhota number = upar dikhega
    // Default 9999 rakha hai taaki jinke liye priority set na ho,
    // wo hamesha explicitly priority set ki hui listings ke baad aayein
    priority: {
      type: Number,
      default: 9999,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);
