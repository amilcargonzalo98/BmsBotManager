import express from 'express';
import { reportState, getPoints } from '../controllers/pointController.js';

const router = express.Router();

router.post('/points/state', reportState);
router.get('/points', getPoints);

export default router;
