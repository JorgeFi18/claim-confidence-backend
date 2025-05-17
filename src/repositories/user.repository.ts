import { Filter } from 'mongodb';
import { BaseRepository } from './base.repository';
import { IUser, UserRole } from '../types';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email } as Filter<IUser>);
  }

  async findManagers(): Promise<IUser[]> {
    return this.find({
      role: UserRole.MANAGER,
      isDeleted: false
    } as Filter<IUser>);
  }

  async findManagersByProvider(providerId: string): Promise<IUser[]> {
    return this.find({
      role: UserRole.MANAGER,
      providerId,
      isDeleted: false
    } as Filter<IUser>);
  }

  async findClaimants(): Promise<IUser[]> {
    return this.find({
      role: UserRole.CLAIMANT,
      isDeleted: false
    } as Filter<IUser>);
  }

  async updateLastLogin(id: string): Promise<IUser | null> {
    return this.update(id, { lastLogin: new Date() });
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.collection.countDocuments({
      email,
      isDeleted: false
    } as Filter<IUser>);
    return count > 0;
  }
}