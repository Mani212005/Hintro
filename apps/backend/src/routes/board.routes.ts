import { Router } from 'express';
import { boardController } from '@/controllers/board.controller.js';
import { authenticate, requireBoardAdmin, requireBoardMember } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.middleware.js';
import {
  boardActivitySchema,
  boardIdSchema,
  boardListSchema,
  createBoardSchema,
  updateBoardSchema
} from '@/validators/board.validator.js';
import { createListSchema } from '@/validators/list.validator.js';
import { listController } from '@/controllers/list.controller.js';
import { asyncHandler } from '@/utils/async-handler.js';

export const boardRouter = Router();

boardRouter.use(authenticate);

boardRouter.get('/', validate(boardListSchema), asyncHandler(boardController.list));
boardRouter.post('/', validate(createBoardSchema), asyncHandler(boardController.create));
boardRouter.get('/:id', validate(boardIdSchema), asyncHandler(requireBoardMember), asyncHandler(boardController.getById));
boardRouter.patch('/:id', validate(updateBoardSchema), asyncHandler(requireBoardMember), asyncHandler(boardController.update));
boardRouter.delete(
  '/:id',
  validate(boardIdSchema),
  asyncHandler(requireBoardMember),
  requireBoardAdmin,
  asyncHandler(boardController.remove)
);

boardRouter.post('/:boardId/lists', validate(createListSchema), asyncHandler(requireBoardMember), asyncHandler(listController.create));
boardRouter.get('/:id/activity', validate(boardActivitySchema), asyncHandler(requireBoardMember), asyncHandler(boardController.activity));
