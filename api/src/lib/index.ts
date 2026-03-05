import jwt from 'jsonwebtoken';
import type { Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment variables');
if (!JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');

export const saltRound = 10;

export const signAccessToken = (userId: string): string => {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
    return token;
};

export const signRefreshToken = (userId: string, res: Response): string => {
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — matches JWT expiry
  });

  return refreshToken;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
};