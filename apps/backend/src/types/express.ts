/* eslint-disable @typescript-eslint/no-namespace */
import type { BoardRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
}

export interface BoardMembershipContext {
  boardId: string;
  role: BoardRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
      boardMembership?: BoardMembershipContext;
    }
  }
}
