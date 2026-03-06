import type { Request, Response } from 'express';
import { prisma } from '../lib/db.ts';
import bcrypt from 'bcrypt';
import { saltRound } from '../lib/index.ts';

export interface AuthRequest extends Request {
  userId?: string;
}

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, name: true, email: true,
        avatarColor: true, accentTheme: true, darkMode: true, createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ user });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, email } = req.body as { name?: string; email?: string };

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== req.userId) {
        return res.status(409).json({ message: 'Email already in use' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name  ? { name }  : {}),
        ...(email ? { email } : {}),
      },
      select: {
        id: true, name: true, email: true,
        avatarColor: true, accentTheme: true, darkMode: true, createdAt: true,
      },
    });

    return res.status(200).json({ user, message: 'Profile updated' });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, saltRound);
    await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const { darkMode, accentTheme, avatarColor } = req.body as {
      darkMode?: boolean;
      accentTheme?: string;
      avatarColor?: string;
    };

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(darkMode     !== undefined ? { darkMode }     : {}),
        ...(accentTheme  !== undefined ? { accentTheme }  : {}),
        ...(avatarColor  !== undefined ? { avatarColor }  : {}),
      },
      select: {
        id: true, name: true, email: true,
        avatarColor: true, accentTheme: true, darkMode: true, createdAt: true,
      },
    });

    return res.status(200).json({ user, message: 'Preferences updated' });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};