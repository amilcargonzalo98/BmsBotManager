import express from 'express';
import {
  getConfig,
  updateConfig,
  sendMessage,
  twilioWebhook,
  getMessages
} from '../controllers/twilioController.js';
const router = express.Router();

router.get('/twilio', getConfig);
router.post('/twilio', updateConfig);
router.post('/twilio/send', sendMessage);
router.post('/twilio/webhook', express.urlencoded({ extended: false }), twilioWebhook);
router.get('/twilio/messages', getMessages);

export default router;
