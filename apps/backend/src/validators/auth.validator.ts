import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(255),
    email: z.string().email().max(255),
    password: z.string().min(8).max(128)
  }),
  params: z.object({}),
  query: z.object({})
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128)
  }),
  params: z.object({}),
  query: z.object({})
});

export const refreshSchema = z.object({
  body: z.object({
    refresh_token: z.string().min(10)
  }),
  params: z.object({}),
  query: z.object({})
});

export const logoutSchema = refreshSchema;
