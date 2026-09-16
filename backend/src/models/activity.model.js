const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['user_registered', 'owner_added', 'room_added', 'room_updated', 'room_deleted', 'payment_received', 'tenant_assigned'],
    required: true
  },
  message: { type: String, required: true },
  refId: { type: mongoose.Schema.Types.ObjectId },
  refModel: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
