import { UserRole } from './index';
import { Request, RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        providerId?: string;
      };
    }
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  providerId?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export type AuthenticatedRequestHandler<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any
> = RequestHandler<
  P,
  ResBody,
  ReqBody,
  any,
  { user: AuthenticatedUser }
>;

export interface AuthenticatedRequestWithParams<P> extends AuthenticatedRequest {
  params: P;
}

export interface AuthenticatedRequestWithBody<B> extends AuthenticatedRequest {
  body: B;
}

export interface AuthenticatedRequestWithParamsAndBody<P, B> extends AuthenticatedRequest {
  params: P;
  body: B;
}