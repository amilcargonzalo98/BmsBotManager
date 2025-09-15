import express from 'express';
import { getDataLogs } from '../controllers/dataLogController.js';

const router = express.Router();

router.get('/datalogs', getDataLogs);

export default router;
