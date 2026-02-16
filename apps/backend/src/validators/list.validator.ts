import { z } from 'zod';
import { uuidSchema } from './common.validator.js';

export const createListSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(255),
    position: z.coerce.number().int().min(0).optional()
  }),
  params: z.object({
    boardId: uuidSchema
  }),
  query: z.object({})
});

export const updateListSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(255).optional(),
    position: z.coerce.number().int().min(0).optional()
  }),
  params: z.object({
    id: uuidSchema
  }),
  query: z.object({})
});

export const deleteListSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: uuidSchema
  }),
  query: z.object({})
});
