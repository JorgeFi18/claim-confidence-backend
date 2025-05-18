import express from 'express';

import logRouting from './middlewares/log.middleware';
import healthCheck from './controllers/health.controller';
import authRoutes from './routes/auth.routes';
import claimRoutes from './routes/claim.routes';
import logRoutes from './routes/log.routes';
import providerRoutes from './routes/provider.routes';

const router = express.Router();

router.use(logRouting);

router.get('/health', healthCheck);

router.use('/auth', authRoutes);

router.use('/claims', claimRoutes);

router.use('/logs', logRoutes);

router.use('/providers', providerRoutes);

export default router;