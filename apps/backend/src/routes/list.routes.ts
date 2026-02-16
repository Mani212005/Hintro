import { Router } from 'express';
import { listController } from '@/controllers/list.controller.js';
import { authenticate } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.middleware.js';
import { deleteListSchema, updateListSchema } from '@/validators/list.validator.js';
import { createTaskSchema } from '@/validators/task.validator.js';
import { taskController } from '@/controllers/task.controller.js';
import { asyncHandler } from '@/utils/async-handler.js';

export const listRouter = Router();

listRouter.use(authenticate);
listRouter.patch('/:id', validate(updateListSchema), asyncHandler(listController.update));
listRouter.delete('/:id', validate(deleteListSchema), asyncHandler(listController.remove));
listRouter.post('/:listId/tasks', validate(createTaskSchema), asyncHandler(taskController.create));
