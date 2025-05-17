import { Filter } from 'mongodb';
import { BaseRepository } from './base.repository';
import { IProvider, ProviderStatus } from '../types';

export class ProviderRepository extends BaseRepository<IProvider> {
  constructor() {
    super('providers');
  }

  async findByEmail(email: string): Promise<IProvider | null> {
    return this.findOne({ email } as Filter<IProvider>);
  }

  async findActive(): Promise<IProvider[]> {
    return this.find({ status: ProviderStatus.ACTIVE } as Filter<IProvider>);
  }

  async findInactive(): Promise<IProvider[]> {
    return this.find({ status: ProviderStatus.INACTIVE } as Filter<IProvider>);
  }

  async updateStatus(id: string, status: ProviderStatus): Promise<IProvider | null> {
    return this.update(id, { status });
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.collection.countDocuments({ email } as Filter<IProvider>);
    return count > 0;
  }
}