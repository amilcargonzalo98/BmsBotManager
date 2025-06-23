import express from 'express';
import { getGroups, createGroup, deleteGroup } from '../controllers/groupController.js';

const router = express.Router();

router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.delete('/groups/:id', deleteGroup);

export default router;
