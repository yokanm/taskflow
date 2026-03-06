import { Router } from 'express';
import {
  getMe,
  updateProfile,
  changePassword,
  updatePreferences,
} from '../controllers/user.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { validate } from '../middleware/validate.middleware.ts';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

router.get('/me',                getMe);
router.patch('/me',              validate(z.object({ name: z.string().min(2).optional(), email: z.string().email().optional() })), updateProfile);
router.patch('/me/password',     validate(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/) })), changePassword);
router.patch('/me/preferences',  validate(z.object({ darkMode: z.boolean().optional(), accentTheme: z.string().optional(), avatarColor: z.string().optional() })), updatePreferences);

export default router;