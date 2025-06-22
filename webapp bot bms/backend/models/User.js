import mongoose from '../config/database.js';

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  phoneNum: String,
  userType: String,
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }
});

export default mongoose.model('User', userSchema);
