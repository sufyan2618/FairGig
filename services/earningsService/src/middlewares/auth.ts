import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import { env } from '../config/env.js';
import type { AuthUser, UserRole } from '../types/auth.js';
import { raise } from '../utils/errors.js';

const getBearerToken = (authorization?: string): string => {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    raise(401, 'UNAUTHORIZED', 'Missing or invalid Bearer token.');
  }

  const token = (authorization as string).slice(7).trim();
  if (!token) {
    raise(401, 'UNAUTHORIZED', 'Missing Bearer token value.');
  }
  return token;
};

const decodeAccessToken = (token: string): AuthUser => {
  const decoded = (() => {
    try {
      return jwt.verify(token, env.accessTokenSecret);
    } catch {
      raise(401, 'UNAUTHORIZED', 'Invalid or expired access token.');
      return null;
    }
  })();

  if (typeof decoded === 'string' || decoded === null) {
    raise(401, 'UNAUTHORIZED', 'Invalid token payload.');
  }

  const payload = decoded as JwtPayload & { role?: string; type?: string };
  const subject = payload.sub as string | undefined;
  const role = payload.role as string | undefined;
  const tokenType = payload.type as string | undefined;

  if (!subject) {
    raise(401, 'UNAUTHORIZED', 'Invalid token subject.');
  }

  if (!role || (role !== 'worker' && role !== 'verifier' && role !== 'advocate')) {
    raise(403, 'FORBIDDEN', 'Invalid role in token.');
  }

  if (tokenType !== 'access') {
    raise(401, 'UNAUTHORIZED', 'Only access tokens are allowed.');
  }

  return {
    id: subject as string,
    role: role as UserRole,
  };
};

const parseUserFromHeaders = (req: Request): void => {
  const headerName = req.header('X-User-Name') ?? undefined;
  const headerEmail = req.header('X-User-Email') ?? undefined;
  if (req.authUser) {
    req.authUser.name = headerName;
    req.authUser.email = headerEmail;
  }
};

export const requireAuth = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const token = getBearerToken(req.header('Authorization'));
    req.authUser = decodeAccessToken(token);
    parseUserFromHeaders(req);

    if (allowedRoles.length > 0 && (!req.authUser || !allowedRoles.includes(req.authUser.role))) {
      raise(403, 'FORBIDDEN', 'You do not have permission for this resource.');
    }

    next();
  };
};

export const requireInternalApiKey = (req: Request, _res: Response, next: NextFunction): void => {
  const provided = req.header('X-Service-Api-Key');
  if (!provided || provided !== env.internalServiceApiKey) {
    raise(401, 'UNAUTHORIZED', 'Invalid internal service API key.');
  }

  req.isInternalService = true;
  next();
};

export const requireWorkerOrInternal = (req: Request, _res: Response, next: NextFunction): void => {
  const serviceKey = req.header('X-Service-Api-Key');
  if (serviceKey && serviceKey === env.internalServiceApiKey) {
    req.isInternalService = true;
    next();
    return;
  }

  const token = getBearerToken(req.header('Authorization'));
  req.authUser = decodeAccessToken(token);
  parseUserFromHeaders(req);

  if (!req.authUser || req.authUser.role !== 'worker') {
    raise(403, 'FORBIDDEN', 'Only workers can access this endpoint.');
  }

  next();
};
