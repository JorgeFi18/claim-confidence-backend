import { ObjectId } from 'mongodb';

export enum UserRole {
  MANAGER = 'manager',
  CLAIMANT = 'claimant'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

export enum ProviderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export enum ClaimStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  REVIEW = 'review',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface IProvider {
  _id?: ObjectId;
  name: string;
  email: string;
  address: string;
  status: ProviderStatus;
}

export interface IUser {
  _id?: ObjectId;
  name: string;
  email: string;
  role: UserRole;
  password: string;
  status: UserStatus;
  lastLogin: Date;
  isDeleted: boolean;
  providerId?: string;
}

export interface IComment {
  _id?: ObjectId;
  name: string;
  message: string;
  createdAt: Date;
}

export interface IClaim {
  _id?: ObjectId;
  userId: string;
  benefit: string;
  fullName: string;
  birthDate: Date;
  gender: string;
  phoneNumber: string;
  workPhoneNumber: string;
  dependants: boolean;
  roleStartDate: Date;
  providerId: string;
  status: ClaimStatus;
  createdAt: Date;
  comments: IComment[];
  isDeleted: boolean;
}

export interface ILog {
  _id?: ObjectId;
  userId: string;
  claimId: string;
  action: string;
  date: Date;
}