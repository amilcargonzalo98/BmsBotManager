import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import './config/database.js';
import userRoutes from './routes/userRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import pointRoutes from './routes/pointRoutes.js';
import twilioRoutes from './routes/twilioRoutes.js';
import alarmRoutes from './routes/alarmRoutes.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api', userRoutes);
app.use('/api', clientRoutes);
app.use('/api', groupRoutes);
app.use('/api', pointRoutes);
app.use('/api', twilioRoutes);
app.use('/api', alarmRoutes);

app.listen(3000, () => console.log('API corriendo en http://localhost:3000'));
