import { Response } from 'express';
import { LogRepository } from '../repositories/log.repository';
import { ApiResponse } from '../types/response';
import { ILog } from '../types';
import { AuthenticatedRequestHandler } from '../types/express';

export class LogController {
  private logRepository: LogRepository;

  constructor() {
    this.logRepository = new LogRepository();
  }

  public getLogs: AuthenticatedRequestHandler<
    {},
    ApiResponse<ILog[]>
  > = async (req, res) => {
    try {
      let logs: ILog[];

      // Si se proporciona claimId como query parameter
      const { claimId } = req.query;

      if (claimId) {
        logs = await this.logRepository.findByClaim(claimId as string);
      } else {
        logs = await this.logRepository.findByUser(req.user?.id!);
      }

      res.status(200).json({
        success: true,
        message: 'Logs retrieved successfully',
        data: logs
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Failed to retrieve logs',
        error: error.message
      });
    }
  };

  public getClaimLogs: AuthenticatedRequestHandler<
    { claimId: string },
    ApiResponse<ILog[]>
  > = async (req, res) => {
    try {
      const { claimId } = req.params;

      const logs = await this.logRepository.findByClaim(claimId);

      res.status(200).json({
        success: true,
        message: 'Claim logs retrieved successfully',
        data: logs
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Failed to retrieve claim logs',
        error: error.message
      });
    }
  };

  public getUserClaimLogs: AuthenticatedRequestHandler<
    { claimId: string },
    ApiResponse<ILog[]>
  > = async (req, res) => {
    try {
      const { claimId } = req.params;
      
      const logs = await this.logRepository.findByUserAndClaim(req.user?.id!, claimId);

      res.status(200).json({
        success: true,
        message: 'User claim logs retrieved successfully',
        data: logs
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Failed to retrieve user claim logs',
        error: error.message
      });
    }
  };
} 