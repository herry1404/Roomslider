const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ownerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  propertyName: { type: String },
  totalRooms: { type: Number, default: 0 },
  role: { type: String, default: "owner" },
  // Electricity rate this owner charges tenants, per unit consumed (₹/unit)
  ratePerUnit: { type: Number, default: 0 },
}, { timestamps: true });

ownerSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('Owner', ownerSchema);
