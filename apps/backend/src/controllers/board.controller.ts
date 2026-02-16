import type { Request, Response } from 'express';
import { boardService } from '@/services/board.service.js';
import { activityService } from '@/services/activity.service.js';
import { success } from '@/utils/response.js';

export const boardController = {
  list: async (req: Request, res: Response) => {
    const result = await boardService.list(req.user!.id, Number(req.query.page), Number(req.query.limit));
    return success(res, result);
  },

  create: async (req: Request, res: Response) => {
    try {
      const result = await boardService.create(req.user!.id, req.body.title, req.body.description);
      return success(res, result, 201);
    } catch (error) {
      console.error('=== BOARD CREATION ERROR ===');
      console.error('Error:', error);
      console.error('User ID:', req.user!.id);
      console.error('Body:', req.body);
      console.error('========================');
      throw error;
    }
  },

  getById: async (req: Request, res: Response) => {
    const result = await boardService.getById(req.user!.id, req.params.id);
    return success(res, result);
  },

  update: async (req: Request, res: Response) => {
    const result = await boardService.update(req.user!.id, req.params.id, req.body);
    return success(res, result);
  },

  remove: async (req: Request, res: Response) => {
    await boardService.remove(req.user!.id, req.params.id);
    return success(res, { message: 'Board deleted' });
  },

  activity: async (req: Request, res: Response) => {
    const result = await activityService.list(
      req.params.id,
      Number(req.query.page),
      Number(req.query.limit),
      req.query.action_type as string | undefined
    );
    return success(res, result);
  }
};
