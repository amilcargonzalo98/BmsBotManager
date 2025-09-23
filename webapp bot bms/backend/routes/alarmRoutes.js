import express from 'express';
import {
  getAlarms,
  createAlarm,
  deleteAlarm,
  updateAlarm,
} from '../controllers/alarmController.js';

const router = express.Router();

router.get('/alarms', getAlarms);
router.post('/alarms', createAlarm);
router.put('/alarms/:id', updateAlarm);
router.delete('/alarms/:id', deleteAlarm);

export default router;
