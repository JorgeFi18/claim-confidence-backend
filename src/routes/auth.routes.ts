import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);

export default router;