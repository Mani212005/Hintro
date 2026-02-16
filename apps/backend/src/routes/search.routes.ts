import { Router } from 'express';
import { searchController } from '@/controllers/search.controller.js';
import { authenticate } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.middleware.js';
import { searchSchema } from '@/validators/search.validator.js';
import { asyncHandler } from '@/utils/async-handler.js';

export const searchRouter = Router();

searchRouter.use(authenticate);
searchRouter.get('/', validate(searchSchema), asyncHandler(searchController.search));
