import express from 'express';
import { reportState, getPoints, updatePointGroup } from '../controllers/pointController.js';

const router = express.Router();

router.post('/points/state', reportState);
router.get('/points', getPoints);
router.patch('/points/:id/group', updatePointGroup);

export default router;
