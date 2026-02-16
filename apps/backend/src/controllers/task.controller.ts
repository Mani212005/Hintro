import type { Request, Response } from 'express';
import { taskService } from '@/services/task.service.js';
import { success } from '@/utils/response.js';

export const taskController = {
  create: async (req: Request, res: Response) => {
    const result = await taskService.create(req.user!.id, req.params.listId, req.body);
    return success(res, result, 201);
  },

  update: async (req: Request, res: Response) => {
    const result = await taskService.update(req.user!.id, req.params.id, req.body);
    return success(res, result);
  },

  remove: async (req: Request, res: Response) => {
    await taskService.remove(req.user!.id, req.params.id);
    return success(res, { message: 'Task deleted' });
  },

  move: async (req: Request, res: Response) => {
    const result = await taskService.move(req.user!.id, req.params.id, req.body.list_id, req.body.position);
    return success(res, result);
  },

  assign: async (req: Request, res: Response) => {
    const result = await taskService.assign(req.user!.id, req.params.id, req.body.user_id);
    return success(res, result);
  },

  unassign: async (req: Request, res: Response) => {
    const result = await taskService.unassign(req.user!.id, req.params.id, req.params.userId);
    return success(res, result);
  }
};
