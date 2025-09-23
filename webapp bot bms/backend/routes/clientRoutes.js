import express from 'express';
import {
  getClients,
  createClient,
  deleteClient,
  updateClientEnabled,
  updateClient,
} from '../controllers/clientController.js';

const router = express.Router();

router.get('/clients', getClients);
router.post('/clients', createClient);
router.put('/clients/:id', updateClient);
router.delete('/clients/:id', deleteClient);
router.patch('/clients/:id/enabled', updateClientEnabled);

export default router;
