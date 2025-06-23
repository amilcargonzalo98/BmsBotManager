import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import './config/database.js';
import userRoutes from './routes/userRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import groupRoutes from './routes/groupRoutes.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api', userRoutes);
app.use('/api', clientRoutes);
app.use('/api', groupRoutes);

app.listen(3000, () => console.log('API corriendo en http://localhost:3000'));
