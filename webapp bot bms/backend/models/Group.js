import mongoose from '../config/database.js';

const groupSchema = new mongoose.Schema({
  groupName: String,
  description: String
});

export default mongoose.model('Group', groupSchema);
