import { Router } from 'express';
import { register, login, tokenRefresh, logout } from '../controllers/auth.controller'; // ✅ named exports
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../schemas';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);
router.post('/refresh',                            tokenRefresh);
router.post('/logout',   authMiddleware,            logout);

export default router;