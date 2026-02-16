import { Router } from 'express';
import { taskController } from '@/controllers/task.controller.js';
import { authenticate } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.middleware.js';
import {
  assignTaskSchema,
  deleteTaskSchema,
  moveTaskSchema,
  unassignTaskSchema,
  updateTaskSchema
} from '@/validators/task.validator.js';
import { asyncHandler } from '@/utils/async-handler.js';

export const taskRouter = Router();

taskRouter.use(authenticate);
taskRouter.patch('/:id', validate(updateTaskSchema), asyncHandler(taskController.update));
taskRouter.delete('/:id', validate(deleteTaskSchema), asyncHandler(taskController.remove));
taskRouter.patch('/:id/move', validate(moveTaskSchema), asyncHandler(taskController.move));
taskRouter.post('/:id/assign', validate(assignTaskSchema), asyncHandler(taskController.assign));
taskRouter.delete('/:id/assign/:userId', validate(unassignTaskSchema), asyncHandler(taskController.unassign));
