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
} from '../controllers/task.controller'; // ✅ named exports
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createTaskSchema, updateTaskSchema } from '../schemas';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

router.get('/',                                                             list);
router.get('/:id',                                                          get);
router.post('/',         validate(createTaskSchema),                        create);
router.patch('/:id',     validate(updateTaskSchema),                        update);
router.patch('/:id/toggle',                                                 toggle);
router.delete('/:id',                                                       deleteTask);
router.post('/:id/subtasks', validate(z.object({ title: z.string().min(1) })), addSubtask);
router.patch('/:id/subtasks/:subId',                                        toggleSubtask);

export default router;