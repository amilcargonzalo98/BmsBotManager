import mongoose from '../config/database.js';

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  phoneNum: String,
  userType: String
});

export default mongoose.model('User', userSchema);
