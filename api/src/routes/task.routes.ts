import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createTaskSchema, updateTaskSchema } from '../schemas';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

router.get('/',                          taskController.list);
router.get('/:id',                       taskController.get);
router.post('/',    validate(createTaskSchema), taskController.create);
router.patch('/:id', validate(updateTaskSchema), taskController.update);
router.patch('/:id/toggle',             taskController.toggle);
router.delete('/:id',                   taskController.delete);

// Subtasks
router.post('/:id/subtasks',    validate(z.object({ title: z.string().min(1) })), taskController.addSubtask);
router.patch('/:id/subtasks/:subId',    taskController.toggleSubtask);

export default router;
