import express from 'express';
import { getEvents } from '../controllers/eventController.js';

const router = express.Router();

router.get('/events', getEvents);

export default router;
