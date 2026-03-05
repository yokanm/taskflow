import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createProjectSchema, updateProjectSchema } from '../schemas';

const router = Router();
router.use(authMiddleware);

router.get('/',         projectController.list);
router.get('/:id',      projectController.get);
router.post('/',    validate(createProjectSchema), projectController.create);
router.patch('/:id', validate(updateProjectSchema), projectController.update);
router.delete('/:id',   projectController.delete);

export default router;
