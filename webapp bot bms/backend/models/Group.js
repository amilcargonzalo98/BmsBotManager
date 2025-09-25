import mongoose from '../config/database.js';

const groupSchema = new mongoose.Schema({
  groupName: String,
  description: String,
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  points: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Point' }]
});

export default mongoose.model('Group', groupSchema);
