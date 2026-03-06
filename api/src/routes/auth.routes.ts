import { Router } from 'express';
import { register, login, tokenRefresh, logout } from '../controllers/auth.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { validate } from '../middleware/validate.middleware.ts';
import { registerSchema, loginSchema } from '../schemas/index.ts';
import { prisma } from '../lib/db.ts';
import type { AuthRequest } from '../middleware/auth.middleware.ts';
import type { Response } from 'express';

const router = Router();

router.post('/auth/register', validate(registerSchema), register);
router.post('/auth/login',    validate(loginSchema),    login);
router.post('/auth/refresh',                            tokenRefresh);
router.post('/auth/logout',   authMiddleware,           logout);

// /auth/me — used by the mobile app on startup for silent re-auth
router.get('/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, name: true, email: true,
        avatarColor: true, accentTheme: true, darkMode: true, createdAt: true,
      },
    });

    if (!user) return res.status(401).json({ message: 'User not found' });

    return res.status(200).json({ user });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;