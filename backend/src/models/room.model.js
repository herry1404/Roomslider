const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },

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

    // Optional — for gender-specific listings (e.g. Male Hostel, Female PG)
    gender: {
      type: String,
      enum: ["Male", "Female", "Any"],
      default: "Any",
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

    // Building/property ye room kis ke andar aata hai (Phase 3 backfill se bharega)
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },

    building: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Sharing label: sirf dikhane ke liye (whole-room booking, tenant logic same)
    sharingType: {
      type: String,
      enum: ["Single", "Double", "Triple", "Other"],
      default: null,
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
      // Set when the tenant gives notice to vacate. Cleared if they cancel.
      // Once this date has passed, the owner sees a prompt to confirm vacating.
      vacateNoticeDate: { type: Date, default: null },
      // Lease/agreement document uploaded by the owner for this tenancy
      leaseDocumentUrl: { type: String, default: "" },
      leaseDocumentName: { type: String, default: "" },
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
            type: { type: String, enum: ["rent", "advance"], default: "rent" },
          },
        ],
      },
    ],

    // ---- END NEW FIELDS ----

    // Total number of times this room's detail page has been opened
    views: {
      type: Number,
      default: 0,
    },

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

roomSchema.index({ slug: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Room", roomSchema);
