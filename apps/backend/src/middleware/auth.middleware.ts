import type { NextFunction, Request, Response } from 'express';
import { BoardRole } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import { verifyToken } from '@/utils/jwt.js';
import { AppError } from '@/utils/errors.js';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.header('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    throw new AppError('UNAUTHORIZED', 'Missing or invalid authorization header', 401);
  }

  const token = header.slice('bearer '.length);

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired token', 401);
  }
};

const extractBoardId = (req: Request): string | undefined =>
  req.params.boardId || req.params.id || (req.body.board_id as string | undefined);

export const requireBoardMember = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const boardId = extractBoardId(req);
  if (!boardId) {
    throw new AppError('VALIDATION_ERROR', 'boardId is required in route params', 422);
  }

  const membership = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId,
        userId: req.user!.id
      }
    }
  });

  if (!membership) {
    throw new AppError('FORBIDDEN', 'Access denied', 403);
  }

  req.boardMembership = { boardId, role: membership.role };
  next();
};

export const requireBoardAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.boardMembership || req.boardMembership.role !== BoardRole.admin) {
    throw new AppError('FORBIDDEN', 'Admin role required', 403);
  }

  next();
};
