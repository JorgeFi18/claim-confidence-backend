import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../types/response';
import { LoginResponse, RegisterUserDTO } from '../types/auth';
import { UserRole } from '../types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public register = async (
    req: Request<{}, {}, RegisterUserDTO>,
    res: Response<ApiResponse<void>>
  ): Promise<void> => {
    try {
      const userData = req.body;

      if (!userData.email || !userData.password || !userData.name || !userData.role) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields',
          error: 'All fields are required'
        });
        return;
      }

      // Validate role is valid
      if (!Object.values(UserRole).includes(userData.role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role',
          error: 'Role must be either manager or claimant'
        });
        return;
      }

      // For manager role, providerId is required
      if (userData.role === UserRole.MANAGER && !userData.providerId) {
        res.status(400).json({
          success: false,
          message: 'Provider ID is required for managers',
          error: 'providerId is required'
        });
        return;
      }

      await this.authService.register(userData);

      res.status(201).json({
        success: true,
        message: 'User registered successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Failed to register user',
        error: error.message
      });
    }
  };

  public login = async (
    req: Request<{}, {}, { email: string; password: string }>,
    res: Response<ApiResponse<LoginResponse>>
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Missing credentials',
          error: 'Email and password are required'
        });
        return;
      }

      const loginResult = await this.authService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: loginResult
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  };
}