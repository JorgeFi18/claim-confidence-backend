import { Filter, ObjectId } from 'mongodb';
import { BaseRepository } from './base.repository';
import { IClaim, ClaimStatus } from '../types';

export class ClaimRepository extends BaseRepository<IClaim> {
  constructor() {
    super('claims');
  }

  async findByUser(userId: string): Promise<IClaim[]> {
    return this.find({
      userId,
      isDeleted: false
    } as Filter<IClaim>);
  }

  async findByProvider(providerId: string): Promise<IClaim[]> {
    return this.find({
      providerId,
      isDeleted: false
    } as Filter<IClaim>);
  }

  async findByStatus(status: ClaimStatus): Promise<IClaim[]> {
    return this.find({
      status,
      isDeleted: false
    } as Filter<IClaim>);
  }

  async findByProviderAndStatus(providerId: string, status: ClaimStatus): Promise<IClaim[]> {
    return this.find({
      providerId,
      status,
      isDeleted: false
    } as Filter<IClaim>);
  }

  async updateStatus(id: string, status: ClaimStatus): Promise<IClaim | null> {
    return this.update(id, { status });
  }

  async addComment(id: string, comment: { name: string; message: string; createdAt: Date }): Promise<IClaim | null> {
    return this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) } as Filter<IClaim>,
      { $push: { comments: comment } },
      { returnDocument: 'after' }
    );
  }
}