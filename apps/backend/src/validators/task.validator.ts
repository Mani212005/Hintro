import { z } from 'zod';
import { uuidSchema } from './common.validator.js';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(500),
    description: z.string().trim().max(5000).optional().nullable(),
    position: z.coerce.number().int().min(0).optional(),
    due_date: z.string().datetime().optional().nullable()
  }),
  params: z.object({
    listId: uuidSchema
  }),
  query: z.object({})
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(500).optional(),
    description: z.string().trim().max(5000).optional().nullable(),
    due_date: z.string().datetime().optional().nullable()
  }),
  params: z.object({
    id: uuidSchema
  }),
  query: z.object({})
});

export const deleteTaskSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: uuidSchema
  }),
  query: z.object({})
});

export const moveTaskSchema = z.object({
  body: z.object({
    list_id: uuidSchema,
    position: z.coerce.number().int().min(0)
  }),
  params: z.object({
    id: uuidSchema
  }),
  query: z.object({})
});

export const assignTaskSchema = z.object({
  body: z.object({
    user_id: uuidSchema
  }),
  params: z.object({
    id: uuidSchema
  }),
  query: z.object({})
});

export const unassignTaskSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: uuidSchema,
    userId: uuidSchema
  }),
  query: z.object({})
});
