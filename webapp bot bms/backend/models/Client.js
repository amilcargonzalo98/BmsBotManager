import mongoose from '../config/database.js';

const clientSchema = new mongoose.Schema({
  clientName: String,
  asiKey: String,
  enabled: String,
  ipAddress: String,
  location: String,
  groupIp: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }
});

export default mongoose.model('Client', clientSchema);
