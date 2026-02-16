import { z } from 'zod';
import { paginationQuerySchema, uuidSchema } from './common.validator.js';

export const boardListSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: paginationQuerySchema
});

export const createBoardSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(4000).optional().nullable()
  }),
  params: z.object({}),
  query: z.object({})
});

export const boardIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: uuidSchema
  }),
  query: z.object({})
});

export const updateBoardSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(4000).nullable().optional()
  }),
  params: z.object({
    id: uuidSchema
  }),
  query: z.object({})
});

export const boardActivitySchema = z.object({
  body: z.object({}),
  params: z.object({
    id: uuidSchema
  }),
  query: paginationQuerySchema.extend({
    action_type: z.string().max(50).optional()
  })
});
