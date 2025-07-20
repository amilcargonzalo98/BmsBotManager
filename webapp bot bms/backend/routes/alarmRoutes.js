import express from 'express';
import { getAlarms, createAlarm, deleteAlarm } from '../controllers/alarmController.js';

const router = express.Router();

router.get('/alarms', getAlarms);
router.post('/alarms', createAlarm);
router.delete('/alarms/:id', deleteAlarm);

export default router;
