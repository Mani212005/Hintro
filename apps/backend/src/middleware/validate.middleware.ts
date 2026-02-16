import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject } from 'zod';
import { AppError } from '@/utils/errors.js';

export const validate = (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction): void => {
  const parsed = schema.safeParse({
    body: req.body ?? {},
    params: req.params ?? {},
    query: req.query ?? {}
  });

  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid input data', 422, parsed.error.errors.map((error) => ({
      field: error.path.join('.'),
      message: error.message
    })));
  }

  req.body = parsed.data.body;
  req.params = parsed.data.params;
  req.query = parsed.data.query as Request['query'];
  next();
};
