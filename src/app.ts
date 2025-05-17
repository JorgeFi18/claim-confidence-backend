import express, { Express } from 'express';

import router from './router';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', router);

export default app;