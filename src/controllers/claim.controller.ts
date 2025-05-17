import { Request, Response } from 'express';
import { ClaimRepository } from '../repositories/claim.repository';
import { LogRepository } from '../repositories/log.repository';
import { ApiResponse } from '../types/response';
import { IClaim, ClaimStatus, UserRole } from '../types';
import { AuthenticatedRequestHandler } from '../types/express';

export class ClaimController {
  private claimRepository: ClaimRepository;
  private logRepository: LogRepository;

  constructor() {
    this.claimRepository = new ClaimRepository();
    this.logRepository = new LogRepository();
  }

  public getClaims: AuthenticatedRequestHandler<
    {},
    ApiResponse<IClaim[]>
  > = async (req, res) => {
    try {
      let claims: IClaim[];

      if (req.user && req.user.role === UserRole.MANAGER) {
        claims = await this.claimRepository.findByProvider(req.user.providerId!);
      } else {
        claims = await this.claimRepository.findByUser(req.user?.id!);
      }

      res.status(200).json({
        success: true,
        message: 'Claims retrieved successfully',
        data: claims
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Failed to retrieve claims',
        error: error.message
      });
    }
  };

  public createClaim: AuthenticatedRequestHandler<
    {},
    ApiResponse<IClaim>,
    Omit<IClaim, 'userId' | 'status' | 'createdAt' | 'comments' | 'isDeleted'>
  > = async (req, res) => {
    try {
      const claimData = {
        ...req.body,
        userId: req.user?.id!,
        status: ClaimStatus.PENDING,
        createdAt: new Date(),
        comments: [],
        isDeleted: false
      };

      const claim = await this.claimRepository.create(claimData);

      // Log the claim creation
      await this.logRepository.logAction(
        req.user?.id!,
        claim._id!.toString(),
        'Created new claim'
      );

      res.status(201).json({
        success: true,
        message: 'Claim created successfully',
        data: claim
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Failed to create claim',
        error: error.message
      });
    }
  };

  public updateClaimStatus: AuthenticatedRequestHandler<
    { id: string },
    ApiResponse<IClaim>,
    { status: ClaimStatus }
  > = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const claim = await this.claimRepository.findById(id);

      if (!claim) {
        res.status(404).json({
          success: false,
          message: 'Claim not found',
          error: 'Invalid claim ID'
        });
        return;
      }

      // Only managers can update to any status
      // Claimants can only update when status is PENDING or REJECTED
      if (req.user && req.user.role === UserRole.CLAIMANT &&
          claim.status !== ClaimStatus.PENDING &&
          claim.status !== ClaimStatus.REJECTED) {
        res.status(403).json({
          success: false,
          message: 'Cannot update claim',
          error: 'Claim cannot be modified in current status'
        });
        return;
      }

      const updatedClaim = await this.claimRepository.updateStatus(id, status);

      // Log the status change
      await this.logRepository.logAction(
        req.user?.id!,
        id,
        `Updated claim status from ${claim.status} to ${status}`
      );

      res.status(200).json({
        success: true,
        message: 'Claim status updated successfully',
        data: updatedClaim!
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Failed to update claim status',
        error: error.message
      });
    }
  };

  public addComment: AuthenticatedRequestHandler<
    { id: string },
    ApiResponse<IClaim>,
    { message: string }
  > = async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;

      const claim = await this.claimRepository.findById(id);

      if (!claim) {
        res.status(404).json({
          success: false,
          message: 'Claim not found',
          error: 'Invalid claim ID'
        });
        return;
      }

      const comment = {
        name: req.user?.email!,
        message,
        createdAt: new Date()
      };

      const updatedClaim = await this.claimRepository.addComment(id, comment);

      // Log the comment addition
      await this.logRepository.logAction(
        req.user?.id!,
        id,
        `Added comment: ${message}`
      );

      res.status(200).json({
        success: true,
        message: 'Comment added successfully',
        data: updatedClaim!
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Failed to add comment',
        error: error.message
      });
    }
  };
}