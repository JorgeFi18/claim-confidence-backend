import { UserRole } from './index';

export interface RegisterUserDTO {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  providerId?: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    providerId?: string;
  }
}