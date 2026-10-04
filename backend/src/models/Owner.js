const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const slugify = require('slugify');

const ownerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"],
  },
  password: { type: String, required: true },
  propertyName: { type: String },
  slug: { type: String, unique: true, sparse: true },
  totalRooms: { type: Number, default: 0 },
  role: { type: String, default: "owner" },
  isVerified: { type: Boolean, default: false },
  // Electricity rate this owner charges tenants, per unit consumed (₹/unit)
  ratePerUnit: { type: Number, default: 0 },
  // Optional social links shown on the owner's public profile page
  instagram: { type: String, default: "" },
  facebook: { type: String, default: "" },
  youtube: { type: String, default: "" },
}, { timestamps: true });

ownerSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  if (!this.slug) {
    const base =
      slugify(`${this.name} ${this.propertyName || ''}`, { lower: true, strict: true }) ||
      'owner';
    let slug = base;
    let i = 1;
    while (await this.constructor.exists({ slug })) slug = `${base}-${++i}`;
    this.slug = slug;
  }
});

module.exports = mongoose.model('Owner', ownerSchema);
