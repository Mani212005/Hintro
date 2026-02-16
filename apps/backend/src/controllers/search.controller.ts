import type { Request, Response } from 'express';
import { searchService } from '@/services/search.service.js';
import { success } from '@/utils/response.js';

export const searchController = {
  search: async (req: Request, res: Response) => {
    const result = await searchService.search({
      userId: req.user!.id,
      query: req.query.query as string,
      boardId: req.query.board_id as string | undefined,
      type: req.query.type as 'board' | 'list' | 'task' | undefined,
      page: Number(req.query.page),
      limit: Number(req.query.limit)
    });

    return success(res, result);
  }
};
