import mongoose from '../config/database.js';

const clientSchema = new mongoose.Schema({
  clientName: String,
  apiKey: String,
  enabled: { type: Boolean, default: false },
  ipAddress: String,
  location: String,
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  connectionStatus: { type: Boolean, default: false },
  lastReport: Date
});

export default mongoose.model('Client', clientSchema);
