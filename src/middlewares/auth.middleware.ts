import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../types';
import { AuthenticatedRequest, AuthenticatedUser } from '../types/express';

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({
          success: false,
          message: 'No token provided',
          error: 'Authentication required'
        });
        return;
      }

      const [bearer, token] = authHeader.split(' ');

      if (bearer !== 'Bearer' || !token) {
        res.status(401).json({
          success: false,
          message: 'Invalid token format',
          error: 'Token must be Bearer token'
        });
        return;
      }

      const decoded = await this.authService.validateToken(token);
      (req as AuthenticatedRequest).user = decoded as AuthenticatedUser;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: 'Invalid token'
      });
    }
  };

  public authorizeManager = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (req.user.role !== UserRole.MANAGER) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'Manager role required'
      });
      return;
    }
    next();
  };

  public authorizeProvider = (providerId: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (req.user.role !== UserRole.MANAGER || req.user.providerId !== providerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'Invalid provider access'
        });
        return;
      }
      next();
    };
  };

  public authorizeClaimant = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user || req.user.role !== UserRole.CLAIMANT) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'Claimant role required'
      });
      return;
    }
    next();
  };
}