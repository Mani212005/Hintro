import type { Request, Response } from 'express';
import { authService } from '@/services/auth.service.js';
import { success } from '@/utils/response.js';

export const authController = {
  signup: async (req: Request, res: Response) => {
    const result = await authService.signup(req.body.name, req.body.email, req.body.password);
    return success(res, result, 201);
  },

  login: async (req: Request, res: Response) => {
    const result = await authService.login(req.body.email, req.body.password);
    return success(res, result);
  },

  me: async (req: Request, res: Response) => {
    const result = await authService.me(req.user!.id);
    return success(res, result);
  },

  refresh: async (req: Request, res: Response) => {
    const result = await authService.refresh(req.body.refresh_token);
    return success(res, result);
  },

  logout: async (req: Request, res: Response) => {
    await authService.logout(req.body.refresh_token);
    return success(res, { message: 'Logged out' });
  }
};
