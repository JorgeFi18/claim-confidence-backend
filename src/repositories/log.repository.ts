import { Filter } from 'mongodb';
import { BaseRepository } from './base.repository';
import { ILog } from '../types';

export class LogRepository extends BaseRepository<ILog> {
  constructor() {
    super('logs');
  }

  async findByUser(userId: string): Promise<ILog[]> {
    return this.find({ userId } as Filter<ILog>);
  }

  async findByClaim(claimId: string): Promise<ILog[]> {
    return this.find({ claimId } as Filter<ILog>);
  }

  async findByUserAndClaim(userId: string, claimId: string): Promise<ILog[]> {
    return this.find({
      userId,
      claimId
    } as Filter<ILog>);
  }

  async logAction(userId: string, claimId: string, action: string): Promise<ILog> {
    return this.create({
      userId,
      claimId,
      action,
      date: new Date()
    });
  }
}