import { Router } from 'express';
import { register, login, tokenRefresh, logout } from '../controllers/auth.controller.ts'; // ✅ named exports
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { validate } from '../middleware/validate.middleware.ts';
import { registerSchema, loginSchema } from '../schemas/index.ts';

const router = Router();

router.post('/auth/register', validate(registerSchema), register);
router.post('/auth/login',    validate(loginSchema),    login);
router.post('/auth/refresh',                            tokenRefresh);
router.post('/auth/logout',   authMiddleware,            logout);

export default router;