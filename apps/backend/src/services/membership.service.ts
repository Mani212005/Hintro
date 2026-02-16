import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/errors.js';

export const membershipService = {
  async assertBoardMember(boardId: string, userId: string) {
    const membership = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId
        }
      }
    });

    if (!membership) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }

    return membership;
  },

  async assertBoardAdmin(boardId: string, userId: string) {
    const membership = await this.assertBoardMember(boardId, userId);

    if (membership.role !== 'admin') {
      throw new AppError('FORBIDDEN', 'Admin role required', 403);
    }

    return membership;
  }
};
