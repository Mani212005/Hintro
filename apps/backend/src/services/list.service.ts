import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/errors.js';
import { serializeList } from '@/utils/serializers.js';
import { membershipService } from './membership.service.js';
import { activityService } from './activity.service.js';
import { websocketEmitter } from '@/websocket/events.js';

const normalizeListPositions = async (boardId: string): Promise<void> => {
  const lists = await prisma.list.findMany({
    where: { boardId },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    select: { id: true }
  });

  await Promise.all(
    lists.map((list, index) =>
      prisma.list.update({
        where: { id: list.id },
        data: { position: index }
      })
    )
  );
};

export const listService = {
  async create(userId: string, boardId: string, title: string, position?: number) {
    await membershipService.assertBoardMember(boardId, userId);

    const total = await prisma.list.count({ where: { boardId } });
    const targetPosition = Math.max(0, Math.min(position ?? total, total));

    const created = await prisma.$transaction(async (tx) => {
      await tx.list.updateMany({
        where: {
          boardId,
          position: { gte: targetPosition }
        },
        data: {
          position: { increment: 1 }
        }
      });

      return tx.list.create({
        data: {
          title,
          boardId,
          position: targetPosition
        }
      });
    });

    await normalizeListPositions(boardId);

    const activity = await activityService.log({
      boardId,
      userId,
      actionType: 'list_created',
      metadata: { list_id: created.id, title }
    });

    websocketEmitter.boardUpdated(boardId, {
      board_id: boardId,
      changes: { action: 'list_created', list_id: created.id }
    });
    websocketEmitter.activityLogged(boardId, { activity });

    return { list: serializeList(created) };
  },

  async update(userId: string, listId: string, updates: { title?: string; position?: number }) {
    const list = await prisma.list.findUnique({ where: { id: listId } });
    if (!list) {
      throw new AppError('NOT_FOUND', 'List not found', 404);
    }

    await membershipService.assertBoardMember(list.boardId, userId);

    await prisma.$transaction(async (tx) => {
      if (typeof updates.position === 'number' && updates.position !== list.position) {
        const total = await tx.list.count({ where: { boardId: list.boardId } });
        const target = Math.max(0, Math.min(updates.position, Math.max(0, total - 1)));

        if (target > list.position) {
          await tx.list.updateMany({
            where: {
              boardId: list.boardId,
              position: { gt: list.position, lte: target }
            },
            data: {
              position: { decrement: 1 }
            }
          });
        } else {
          await tx.list.updateMany({
            where: {
              boardId: list.boardId,
              position: { gte: target, lt: list.position }
            },
            data: {
              position: { increment: 1 }
            }
          });
        }

        await tx.list.update({
          where: { id: list.id },
          data: {
            title: updates.title,
            position: target
          }
        });
      } else {
        await tx.list.update({
          where: { id: list.id },
          data: {
            title: updates.title
          }
        });
      }
    });

    await normalizeListPositions(list.boardId);

    const updated = await prisma.list.findUnique({ where: { id: list.id } });
    if (!updated) {
      throw new AppError('NOT_FOUND', 'List not found after update', 404);
    }

    const activity = await activityService.log({
      boardId: list.boardId,
      userId,
      actionType: 'list_updated',
      metadata: { list_id: list.id, updates }
    });

    websocketEmitter.boardUpdated(list.boardId, {
      board_id: list.boardId,
      changes: { action: 'list_updated', list_id: list.id, updates }
    });
    websocketEmitter.activityLogged(list.boardId, { activity });

    return { list: serializeList(updated) };
  },

  async remove(userId: string, listId: string) {
    const list = await prisma.list.findUnique({ where: { id: listId } });
    if (!list) {
      throw new AppError('NOT_FOUND', 'List not found', 404);
    }

    await membershipService.assertBoardMember(list.boardId, userId);

    await prisma.list.delete({ where: { id: listId } });
    await normalizeListPositions(list.boardId);

    const activity = await activityService.log({
      boardId: list.boardId,
      userId,
      actionType: 'list_deleted',
      metadata: { list_id: list.id }
    });

    websocketEmitter.boardUpdated(list.boardId, {
      board_id: list.boardId,
      changes: { action: 'list_deleted', list_id: list.id }
    });
    websocketEmitter.activityLogged(list.boardId, { activity });
  }
};
