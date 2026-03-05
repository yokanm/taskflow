import { Router } from 'express';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/project.controller'; // ✅ named exports
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createProjectSchema, updateProjectSchema } from '../schemas';

const router = Router();
router.use(authMiddleware);

router.get('/',      listProjects);
router.get('/:id',   getProject);
router.post('/',     validate(createProjectSchema), createProject);
router.patch('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

export default router;