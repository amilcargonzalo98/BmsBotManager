import mongoose from '../config/database.js';

const eventSchema = new mongoose.Schema({
  eventType: { type: String, required: true },
  pointId: { type: mongoose.Schema.Types.ObjectId, ref: 'Point', required: true },
  presentValue: mongoose.Schema.Types.Mixed,
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Event', eventSchema);
