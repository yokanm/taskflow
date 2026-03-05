import { Router } from 'express';
import {
  list,
  get,
  create,
  update,
  toggle,
  deleteTask,
  addSubtask,
  toggleSubtask,
} from '../controllers/task.controller.ts';
import { authMiddleware } from '../middleware/auth.middleware.ts';
import { validate } from '../middleware/validate.middleware.ts';
import { createTaskSchema, updateTaskSchema } from '../schemas/index.ts';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

// Mounted under /api/v1/tasks in app.ts
router.get('/',    list);
router.post('/',   validate(createTaskSchema), create);

// Specific sub-paths BEFORE generic /:id to avoid route conflicts
router.post('/:id/subtasks',         validate(z.object({ title: z.string().min(1) })), addSubtask);
router.patch('/:id/subtasks/:subId', toggleSubtask);
router.patch('/:id/toggle',          toggle);

// Generic /:id routes last
router.get('/:id',    get);
router.patch('/:id',  validate(updateTaskSchema), update);
router.delete('/:id', deleteTask);

export default router;