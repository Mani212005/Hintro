import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { isAppError, AppError } from '@/utils/errors.js';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError('NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, 404));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction): Response => {
  if (isAppError(error)) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? []
      }
    });
  }

  if (error instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: error.errors.map((entry) => ({ field: entry.path.join('.'), message: entry.message }))
      }
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const code = error.code === 'P2002' ? 'CONFLICT' : 'DATABASE_ERROR';
    const statusCode = error.code === 'P2002' ? 409 : 500;

    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message: error.message,
        details: []
      }
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: []
    }
  });
};
