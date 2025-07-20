import mongoose from '../config/database.js';

const twilioConfigSchema = new mongoose.Schema({
  accountSid: String,
  authToken: String,
  whatsappFrom: String
});

export default mongoose.model('TwilioConfig', twilioConfigSchema);
