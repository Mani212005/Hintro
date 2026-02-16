import jwt from 'jsonwebtoken';
import { env } from '@/config/env.js';
import type { AuthenticatedUser } from '@/types/express.js';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  name: string;
}

export interface RefreshTokenPayload {
  userId: string;
  email: string;
  name: string;
}

interface RefreshTokenResult {
  token: string;
  expiresAt: Date;
}

const toEpochSeconds = (duration: string): number => {
  const now = Math.floor(Date.now() / 1000);
  const numeric = Number(duration);

  if (!Number.isNaN(numeric)) {
    return now + numeric;
  }

  const pattern = /^(\d+)([smhd])$/;
  const match = duration.match(pattern);

  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];
  const multiplier = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;

  return now + value * multiplier;
};

const jwtSign = jwt.sign as (
  payload: string | object | Buffer,
  secret: string,
  options?: { expiresIn?: string | number }
) => string;

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwtSign(payload, env.JWT_SECRET, { 
    expiresIn: env.JWT_EXPIRES_IN
  });
};

export const signRefreshToken = (payload: RefreshTokenPayload): RefreshTokenResult => {
  const expiresInSeconds = toEpochSeconds(env.REFRESH_TOKEN_EXPIRES_IN);
  const expiresAt = new Date(expiresInSeconds * 1000);
  const token = jwtSign(payload, env.JWT_SECRET, { 
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN
  });

  return { token, expiresAt };
};

export const verifyToken = (token: string): AuthenticatedUser => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;

  return { id: decoded.userId, email: decoded.email, name: decoded.name };
};