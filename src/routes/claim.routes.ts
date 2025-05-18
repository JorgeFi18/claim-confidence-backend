import { Router } from 'express';
import { ClaimController } from '../controllers/claim.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const claimController = new ClaimController();
const authMiddleware = new AuthMiddleware();

// Get all claims (filtered by user role)
router.get(
  '/',
  authMiddleware.authenticate,
  claimController.getClaims
);

// Get claim by ID
router.get(
  '/:id',
  authMiddleware.authenticate,
  claimController.getClaimById
);

// Create new claim (only claimants)
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorizeClaimant,
  claimController.createClaim
);

// Update claim status
router.patch(
  '/:id/status',
  authMiddleware.authenticate,
  claimController.updateClaimStatus
);

// Add comment to claim
router.post(
  '/:id/comments',
  authMiddleware.authenticate,
  claimController.addComment
);

export default router;