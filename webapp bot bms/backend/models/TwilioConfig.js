import mongoose from '../config/database.js';

const twilioConfigSchema = new mongoose.Schema({
  accountSid: String,
  authToken: String,
  whatsappFrom: String,
  messagingServiceSid: String,
  contentSid: String
});

export default mongoose.model('TwilioConfig', twilioConfigSchema);
