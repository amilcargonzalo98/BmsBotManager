import mongoose from '../config/database.js';

const alarmSchema = new mongoose.Schema({
  alarmName: { type: String, required: true },
  pointId: { type: mongoose.Schema.Types.ObjectId, ref: 'Point', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  conditionType: { type: String, enum: ['true', 'false', 'gt', 'lt'], required: true },
  threshold: mongoose.Schema.Types.Mixed,
});

export default mongoose.model('Alarm', alarmSchema);
