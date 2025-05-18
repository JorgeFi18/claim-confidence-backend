import { Router } from 'express';
import { ProviderController } from '../controllers/provider.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const providerController = new ProviderController();
const authMiddleware = new AuthMiddleware();

// Get all active providers
router.get('/', authMiddleware.authenticate, providerController.getProviders);

export default router;