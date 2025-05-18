import { Request, Response } from 'express';
import { ProviderRepository } from '../repositories/provider.repository';
import { ApiResponse } from '../types/response';
import { IProvider } from '../types';

export class ProviderController {
  private providerRepository: ProviderRepository;

  constructor() {
    this.providerRepository = new ProviderRepository();
  }

  public getProviders = async (
    req: Request,
    res: Response<ApiResponse<IProvider[]>>
  ): Promise<void> => {
    try {
      const providers = await this.providerRepository.findActive();

      res.status(200).json({
        success: true,
        message: 'Providers retrieved successfully',
        data: providers
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Failed to retrieve providers',
        error: error.message
      });
    }
  };
}