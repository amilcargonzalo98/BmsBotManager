import express from 'express';
import {
  getGroups,
  createGroup,
  deleteGroup,
  updateGroup,
} from '../controllers/groupController.js';

const router = express.Router();

router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.put('/groups/:id', updateGroup);
router.delete('/groups/:id', deleteGroup);

export default router;
