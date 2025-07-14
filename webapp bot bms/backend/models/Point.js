import mongoose from '../config/database.js';

const pointSchema = new mongoose.Schema({
  pointName: String,
  ipAddress: String,
  pointType: Number,
  pointId: Number,
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' }
});

export default mongoose.model('Point', pointSchema);
