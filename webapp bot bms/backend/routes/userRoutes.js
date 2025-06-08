import express from 'express';
import { login, getUsers, createUser, deleteUser } from '../controllers/userController.js';

const router = express.Router();

router.post('/login', login);
router.get('/users', getUsers);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);

export default router;
