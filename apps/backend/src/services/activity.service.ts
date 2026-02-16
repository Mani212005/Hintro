import { prisma } from '@/config/prisma.js';
import { Prisma } from '@prisma/client';
import { serializeActivity } from '@/utils/serializers.js';
import { parsePagination, paginationMeta } from '@/utils/pagination.js';

interface LogActivityInput {
  boardId: string;
  taskId?: string | null;
  userId?: string | null;
  actionType: string;
  metadata?: Record<string, unknown>;
}

export const activityService = {
  async log(input: LogActivityInput) {
    const activity = await prisma.activity.create({
      data: {
        boardId: input.boardId,
        taskId: input.taskId ?? null,
        userId: input.userId ?? null,
        actionType: input.actionType,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue
      },
      include: {
        user: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } }
      }
    });

    return serializeActivity(activity);
  },

  async list(boardId: string, page?: number, limit?: number, actionType?: string) {
    const pagination = parsePagination(page, limit);
    const where = {
      boardId,
      ...(actionType ? { actionType } : {})
    };

    const [activities, total] = await prisma.$transaction([
      prisma.activity.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      prisma.activity.count({ where })
    ]);

    return {
      activities: activities.map(serializeActivity),
      pagination: paginationMeta(pagination, total)
    };
  }
};
