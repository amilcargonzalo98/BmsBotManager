import mongoose from '../config/database.js';

const twilioMessageSchema = new mongoose.Schema({
  from: String,
  to: String,
  body: String,
  direction: String,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('TwilioMessage', twilioMessageSchema);
