import { Router } from 'express';
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from '../controllers/project.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { validate } from '../middleware/validate.middleware.ts';
import { createProjectSchema, updateProjectSchema } from '../schemas/index.ts';

const router = Router();
router.use(authMiddleware);

// Mounted under /api/v1/projects in app.ts
router.get('/', listProjects);
router.post('/', validate(createProjectSchema), createProject);
router.get('/:id', getProject);
router.patch('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

export default router;
