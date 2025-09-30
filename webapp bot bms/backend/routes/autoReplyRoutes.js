import express from 'express';
import {
  getAutoReplies,
  createAutoReply,
  updateAutoReply,
  deleteAutoReply,
} from '../controllers/autoReplyController.js';

const router = express.Router();

router.get('/auto-replies', getAutoReplies);
router.post('/auto-replies', createAutoReply);
router.put('/auto-replies/:id', updateAutoReply);
router.delete('/auto-replies/:id', deleteAutoReply);

export default router;
