import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/errors.js';
import { parsePagination, paginationMeta } from '@/utils/pagination.js';
import { serializeBoard, serializeList, serializeTask } from '@/utils/serializers.js';
import { membershipService } from './membership.service.js';
import { activityService } from './activity.service.js';
import { websocketEmitter } from '@/websocket/events.js';

export const boardService = {
  async list(userId: string, page?: number, limit?: number) {
    const pagination = parsePagination(page, limit);

    const [boardMemberships, total] = await prisma.$transaction([
      prisma.boardMember.findMany({
        where: { userId },
        include: {
          board: {
            include: {
              _count: {
                select: { members: true }
              }
            }
          }
        },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { joinedAt: 'desc' }
      }),
      prisma.boardMember.count({ where: { userId } })
    ]);

    const boards = boardMemberships.map((membership) =>
      serializeBoard({ ...membership.board, membersCount: membership.board._count.members })
    );

    return {
      boards,
      pagination: paginationMeta(pagination, total)
    };
  },

  async create(userId: string, title: string, description?: string | null) {
    const board = await prisma.board.create({
      data: {
        title,
        description: description ?? null,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'admin'
          }
        }
      }
    });

    await activityService.log({
      boardId: board.id,
      userId,
      actionType: 'board_created',
      metadata: { title: board.title }
    });

    websocketEmitter.boardUpdated(board.id, {
      board_id: board.id,
      changes: { action: 'created' }
    });

    return { board: serializeBoard(board) };
  },

  async getById(userId: string, boardId: string) {
    await membershipService.assertBoardMember(boardId, userId);

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        lists: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignments: {
                  include: {
                    user: {
                      select: { id: true, name: true, email: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!board) {
      throw new AppError('NOT_FOUND', 'Board not found', 404);
    }

    return {
      board: {
        ...serializeBoard(board),
        lists: board.lists.map((list) => ({
          ...serializeList(list),
          tasks: list.tasks.map((task) => serializeTask(task))
        }))
      }
    };
  },

  async update(userId: string, boardId: string, updates: { title?: string; description?: string | null }) {
    await membershipService.assertBoardMember(boardId, userId);

    const board = await prisma.board.update({
      where: { id: boardId },
      data: updates
    });

    const activity = await activityService.log({
      boardId,
      userId,
      actionType: 'board_updated',
      metadata: updates as Record<string, unknown>
    });

    websocketEmitter.boardUpdated(boardId, {
      board_id: boardId,
      changes: updates as Record<string, unknown>
    });

    websocketEmitter.activityLogged(boardId, { activity });

    return { board: serializeBoard(board) };
  },

  async remove(userId: string, boardId: string) {
    await membershipService.assertBoardAdmin(boardId, userId);

    await prisma.board.delete({ where: { id: boardId } });

    websocketEmitter.boardUpdated(boardId, {
      board_id: boardId,
      changes: { action: 'deleted' }
    });
  }
};
