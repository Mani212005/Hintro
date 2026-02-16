import { Router } from 'express';
import { authController } from '@/controllers/auth.controller.js';
import { authenticate } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.middleware.js';
import { loginSchema, logoutSchema, refreshSchema, signupSchema } from '@/validators/auth.validator.js';
import { asyncHandler } from '@/utils/async-handler.js';

export const authRouter = Router();

authRouter.post('/signup', validate(signupSchema), asyncHandler(authController.signup));
authRouter.post('/login', validate(loginSchema), asyncHandler(authController.login));
authRouter.get('/me', authenticate, asyncHandler(authController.me));
authRouter.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
authRouter.post('/logout', validate(logoutSchema), asyncHandler(authController.logout));
