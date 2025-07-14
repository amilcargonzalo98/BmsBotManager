import mongoose from '../config/database.js';

const dataLogSchema = new mongoose.Schema({
  pointId: { type: mongoose.Schema.Types.ObjectId, ref: 'Point' },
  presentValue: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('DataLog', dataLogSchema);
