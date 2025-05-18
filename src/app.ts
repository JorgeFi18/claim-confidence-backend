import express, { Express } from 'express';
import cors from 'cors';

import router from './router';

const app: Express = express();

// Configure CORS
app.use(cors({
  origin: ['http://localhost:4200', 'https://main.d3dassni0i91jn.amplifyapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', router);

export default app;