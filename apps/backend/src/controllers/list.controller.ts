import type { Request, Response } from 'express';
import { listService } from '@/services/list.service.js';
import { success } from '@/utils/response.js';

export const listController = {
  create: async (req: Request, res: Response) => {
    const result = await listService.create(req.user!.id, req.params.boardId, req.body.title, req.body.position);
    return success(res, result, 201);
  },

  update: async (req: Request, res: Response) => {
    const result = await listService.update(req.user!.id, req.params.id, req.body);
    return success(res, result);
  },

  remove: async (req: Request, res: Response) => {
    await listService.remove(req.user!.id, req.params.id);
    return success(res, { message: 'List deleted' });
  }
};
