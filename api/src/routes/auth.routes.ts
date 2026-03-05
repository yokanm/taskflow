import { Router } from 'express';
import { register, login, tokenRefresh, logout } from '../controllers/auth.controller'; // ✅ named exports
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../schemas';

const router = Router();

router.post('/api/v1/register', validate(registerSchema), register);
router.post('/api/v1/login',    validate(loginSchema),    login);
router.post('/api/v1/refresh',                            tokenRefresh);
router.post('/api/v1/logout',   authMiddleware,            logout);

export default router;