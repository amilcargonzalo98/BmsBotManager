import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import './config/database.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api', userRoutes);

app.listen(3000, () => console.log('API corriendo en http://localhost:3000'));
