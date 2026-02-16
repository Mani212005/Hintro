import { z } from 'zod';
import { paginationQuerySchema, uuidSchema } from './common.validator.js';

export const searchSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: paginationQuerySchema.extend({
    query: z.string().trim().min(1),
    board_id: uuidSchema.optional(),
    type: z.enum(['board', 'list', 'task']).optional()
  })
});
