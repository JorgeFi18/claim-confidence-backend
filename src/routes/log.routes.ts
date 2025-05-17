import { Router } from 'express';
import { LogController } from '../controllers/log.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const logController = new LogController();
const authMiddleware = new AuthMiddleware();

// Get all logs for the authenticated user
router.get(
  '/',
  authMiddleware.authenticate,
  logController.getLogs
);

// Get logs for a specific claim
router.get(
  '/claim/:claimId',
  authMiddleware.authenticate,
  logController.getClaimLogs
);

// Get logs for a specific claim and user
router.get(
  '/claim/:claimId/user',
  authMiddleware.authenticate,
  logController.getUserClaimLogs
);

export default router; 