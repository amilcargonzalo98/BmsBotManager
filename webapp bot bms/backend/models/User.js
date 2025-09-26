import mongoose from '../config/database.js';

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  phoneNum: String,
  userType: String,
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }]
});

const appendLegacyGroupId = (_doc, ret) => {
  const existingGroups = Array.isArray(ret.groups) ? ret.groups : [];
  if (existingGroups.length === 0 && ret.groupId) {
    try {
      ret.groups = [new mongoose.Types.ObjectId(ret.groupId)];
    } catch (err) {
      ret.groups = [ret.groupId];
    }
  } else {
    ret.groups = existingGroups;
  }
  const [firstGroup] = ret.groups;
  if (firstGroup && typeof firstGroup === 'object' && firstGroup !== null && firstGroup._id) {
    ret.groupId = firstGroup._id.toString();
  } else if (firstGroup) {
    try {
      ret.groupId = firstGroup.toString();
    } catch (err) {
      ret.groupId = firstGroup;
    }
  } else {
    ret.groupId = null;
  }
  return ret;
};

userSchema.set('toJSON', { transform: appendLegacyGroupId });
userSchema.set('toObject', { transform: appendLegacyGroupId });

export default mongoose.model('User', userSchema);
