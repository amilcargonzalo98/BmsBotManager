import express from 'express';
import { reportState } from '../controllers/pointController.js';

const router = express.Router();

router.post('/points/state', reportState);

export default router;
