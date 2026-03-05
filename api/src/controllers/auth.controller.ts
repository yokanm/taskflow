import { prisma } from '../lib/db';
import bcrypt from 'bcrypt';
import { saltRound, signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib';
import type { Request, Response } from 'express';

interface Auth {
  name: string;
  email: string;
  password: string;
}

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password }: Auth = req.body;

    if (await prisma.user.findUnique({ where: { email } })) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRound);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const accessToken = signAccessToken(user.id); // expires 15m
    signRefreshToken(user.id, res);               // ✅ expires 7d, sets cookie

    return res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
        accentTheme: user.accentTheme,
        darkMode: user.darkMode,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: Auth = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email or password is invalid' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Email or password is invalid' });
    }

    const accessToken = signAccessToken(user.id); // expires 15m
    signRefreshToken(user.id, res);               // expires 7d, sets cookie

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
        accentTheme: user.accentTheme,
        darkMode: user.darkMode,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const tokenRefresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies['refreshToken'] as string | undefined;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token not found' });
    }

    const decoded = verifyRefreshToken(refreshToken); // throws if invalid/expired

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const newAccessToken = signAccessToken(user.id);
    signRefreshToken(user.id, res); // rotate the refresh token cookie

    return res.status(200).json({
      message: 'Token refreshed',
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

export const logout = async (_req: Request, res: Response) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
    });

    return res.status(200).json({ // ✅ 200 not 204 — 204 cannot have a body
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};