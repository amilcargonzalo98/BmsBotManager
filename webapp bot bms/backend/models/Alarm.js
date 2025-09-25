import mongoose from '../config/database.js';

const alarmSchema = new mongoose.Schema({
  alarmName: { type: String, required: true },
  monitorType: {
    type: String,
    enum: ['point', 'clientConnection'],
    default: 'point',
  },
  pointId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Point',
    required() {
      return (this.monitorType ?? 'point') === 'point';
    },
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required() {
      return (this.monitorType ?? 'point') === 'clientConnection';
    },
  },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  conditionType: { type: String, enum: ['true', 'false', 'gt', 'lt'], required: true },
  threshold: { type: Number, default: null },
  active: { type: Boolean, default: false },
});

export default mongoose.model('Alarm', alarmSchema);
