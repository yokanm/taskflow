import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { config } from '../config/index.ts';

export const saltRound = 10;

export const signAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
};

export const signRefreshToken = (userId: string, res: Response): void => {
  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: config.jwt.refreshCookieMaxAge, // 7 days — matches JWT expiry
  });
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
};