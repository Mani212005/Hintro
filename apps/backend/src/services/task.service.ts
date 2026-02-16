import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/errors.js';
import { serializeTask } from '@/utils/serializers.js';
import { membershipService } from './membership.service.js';
import { activityService } from './activity.service.js';
import { websocketEmitter } from '@/websocket/events.js';
import { calculateMoveTarget } from '@/utils/task-move.js';

const normalizeTaskPositions = async (tx: Prisma.TransactionClient, listId: string): Promise<void> => {
  await tx.$executeRaw`
    WITH ordered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY position ASC, "createdAt" ASC) - 1 AS new_position
      FROM "Task"
      WHERE "listId" = ${listId} ::uuid
    )
    UPDATE "Task" t
    SET position = ordered.new_position
    FROM ordered
    WHERE t.id = ordered.id
  `;
};

const fetchTaskWithRelations = (taskId: string) =>
  prisma.task.findUnique({
    where: { id: taskId },
    include: {
      list: true,
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  });

export const taskService = {
  async create(
    userId: string,
    listId: string,
    input: { title: string; description?: string | null; position?: number; due_date?: string | null }
  ) {
    const list = await prisma.list.findUnique({ where: { id: listId } });
    if (!list) {
      throw new AppError('NOT_FOUND', 'List not found', 404);
    }

    await membershipService.assertBoardMember(list.boardId, userId);

    const count = await prisma.task.count({ where: { listId } });
    const targetPosition = calculateMoveTarget({
      sameList: false,
      targetPosition: input.position ?? count,
      sourceCount: count,
      destinationCount: count
    });

    const task = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT id FROM "Task" WHERE "listId" = ${listId}::uuid FOR UPDATE`;


      await tx.task.updateMany({
        where: {
          listId,
          position: { gte: targetPosition }
        },
        data: {
          position: { increment: 1 }
        }
      });

      const created = await tx.task.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          listId,
          position: targetPosition,
          dueDate: input.due_date ? new Date(input.due_date) : null,
          createdById: userId
        }
      });

      await normalizeTaskPositions(tx, listId);
      return created;
    });

    const enriched = await fetchTaskWithRelations(task.id);
    if (!enriched) {
      throw new AppError('NOT_FOUND', 'Task not found after create', 404);
    }

    const activity = await activityService.log({
      boardId: list.boardId,
      taskId: task.id,
      userId,
      actionType: 'task_created',
      metadata: { list_id: listId, title: task.title }
    });

    const serializedTask = serializeTask(enriched);
    websocketEmitter.taskCreated(list.boardId, {
      task: serializedTask,
      list_id: listId
    });
    websocketEmitter.activityLogged(list.boardId, { activity });

    return { task: serializedTask };
  },

  async update(
    userId: string,
    taskId: string,
    input: { title?: string; description?: string | null; due_date?: string | null }
  ) {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { list: true }
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Task not found', 404);
    }

    await membershipService.assertBoardMember(existing.list.boardId, userId);

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: input.title,
        description: input.description,
        dueDate: input.due_date === undefined ? undefined : input.due_date ? new Date(input.due_date) : null
      },
      include: {
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    const activity = await activityService.log({
      boardId: existing.list.boardId,
      taskId,
      userId,
      actionType: 'task_updated',
      metadata: { updates: input }
    });

    const serializedTask = serializeTask(updated);

    websocketEmitter.taskUpdated(existing.list.boardId, {
      task_id: taskId,
      changes: serializedTask
    });
    websocketEmitter.activityLogged(existing.list.boardId, { activity });

    return { task: serializedTask };
  },

  async remove(userId: string, taskId: string) {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { list: true }
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Task not found', 404);
    }

    await membershipService.assertBoardMember(existing.list.boardId, userId);

    await prisma.$transaction(async (tx) => {
      // FIXED: Added ::uuid cast
      await tx.$executeRaw`SELECT id FROM "Task" WHERE "listId" = ${existing.listId}::uuid FOR UPDATE`;

      await tx.task.delete({ where: { id: taskId } });
      await tx.task.updateMany({
        where: {
          listId: existing.listId,
          position: { gt: existing.position }
        },
        data: {
          position: { decrement: 1 }
        }
      });

      await normalizeTaskPositions(tx, existing.listId);
    });

    const activity = await activityService.log({
      boardId: existing.list.boardId,
      taskId,
      userId,
      actionType: 'task_deleted',
      metadata: { list_id: existing.listId }
    });

    websocketEmitter.taskDeleted(existing.list.boardId, {
      task_id: taskId,
      list_id: existing.listId
    });
    websocketEmitter.activityLogged(existing.list.boardId, { activity });
  },

  async move(userId: string, taskId: string, targetListId: string, targetPosition: number) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { list: true }
    });

    if (!task) {
      throw new AppError('NOT_FOUND', 'Task not found', 404);
    }

    await membershipService.assertBoardMember(task.list.boardId, userId);

    const destinationList = await prisma.list.findUnique({ where: { id: targetListId } });
    if (!destinationList || destinationList.boardId !== task.list.boardId) {
      throw new AppError('VALIDATION_ERROR', 'Destination list is invalid', 422);
    }

    const result = await prisma.$transaction(async (tx) => {
      // FIXED: Added ::uuid casts to both queries
      await tx.$executeRaw`SELECT id FROM "Task" WHERE "listId" = ${task.listId}::uuid FOR UPDATE`;
      if (task.listId !== targetListId) {
        await tx.$executeRaw`SELECT id FROM "Task" WHERE "listId" = ${targetListId}::uuid FOR UPDATE`;
      }

      const sourceCount = await tx.task.count({ where: { listId: task.listId } });
      const destinationCount = await tx.task.count({ where: { listId: targetListId } });

      const target = calculateMoveTarget({
        sameList: task.listId === targetListId,
        targetPosition,
        sourceCount,
        destinationCount
      });

      if (task.listId === targetListId) {
        if (target > task.position) {
          await tx.task.updateMany({
            where: {
              listId: task.listId,
              position: { gt: task.position, lte: target }
            },
            data: {
              position: { decrement: 1 }
            }
          });
        } else if (target < task.position) {
          await tx.task.updateMany({
            where: {
              listId: task.listId,
              position: { gte: target, lt: task.position }
            },
            data: {
              position: { increment: 1 }
            }
          });
        }

        await tx.task.update({
          where: { id: task.id },
          data: {
            position: target
          }
        });

        await normalizeTaskPositions(tx, task.listId);
      } else {
        await tx.task.updateMany({
          where: {
            listId: task.listId,
            position: { gt: task.position }
          },
          data: {
            position: { decrement: 1 }
          }
        });

        await tx.task.updateMany({
          where: {
            listId: targetListId,
            position: { gte: target }
          },
          data: {
            position: { increment: 1 }
          }
        });

        await tx.task.update({
          where: { id: task.id },
          data: {
            listId: targetListId,
            position: target
          }
        });

        await normalizeTaskPositions(tx, task.listId);
        await normalizeTaskPositions(tx, targetListId);
      }

      const moved = await tx.task.findUnique({
        where: { id: task.id },
        include: {
          assignments: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });

      return { moved, target };
    });

    if (!result.moved) {
      throw new AppError('NOT_FOUND', 'Task not found after move', 404);
    }

    const activity = await activityService.log({
      boardId: task.list.boardId,
      taskId,
      userId,
      actionType: 'task_moved',
      metadata: {
        from_list: task.listId,
        to_list: targetListId,
        position: result.target
      }
    });

    websocketEmitter.taskMoved(task.list.boardId, {
      task_id: taskId,
      from_list: task.listId,
      to_list: targetListId,
      position: result.target
    });
    websocketEmitter.activityLogged(task.list.boardId, { activity });

    return { task: serializeTask(result.moved) };
  },

  async assign(userId: string, taskId: string, assigneeId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { list: true }
    });

    if (!task) {
      throw new AppError('NOT_FOUND', 'Task not found', 404);
    }

    await membershipService.assertBoardMember(task.list.boardId, userId);
    await membershipService.assertBoardMember(task.list.boardId, assigneeId);

    await prisma.taskAssignment.upsert({
      where: {
        taskId_userId: {
          taskId,
          userId: assigneeId
        }
      },
      update: {},
      create: {
        taskId,
        userId: assigneeId
      }
    });

    const updated = await fetchTaskWithRelations(taskId);
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Task not found after assignment', 404);
    }

    const activity = await activityService.log({
      boardId: task.list.boardId,
      taskId,
      userId,
      actionType: 'task_assigned',
      metadata: { assignee_id: assigneeId }
    });

    const serializedTask = serializeTask(updated);
    websocketEmitter.taskUpdated(task.list.boardId, {
      task_id: taskId,
      changes: serializedTask
    });
    websocketEmitter.activityLogged(task.list.boardId, { activity });

    return { task: serializedTask };
  },

  async unassign(userId: string, taskId: string, assigneeId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { list: true }
    });

    if (!task) {
      throw new AppError('NOT_FOUND', 'Task not found', 404);
    }

    await membershipService.assertBoardMember(task.list.boardId, userId);

    await prisma.taskAssignment.deleteMany({
      where: {
        taskId,
        userId: assigneeId
      }
    });

    const updated = await fetchTaskWithRelations(taskId);
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Task not found after unassignment', 404);
    }

    const activity = await activityService.log({
      boardId: task.list.boardId,
      taskId,
      userId,
      actionType: 'task_unassigned',
      metadata: { assignee_id: assigneeId }
    });

    const serializedTask = serializeTask(updated);
    websocketEmitter.taskUpdated(task.list.boardId, {
      task_id: taskId,
      changes: serializedTask
    });
    websocketEmitter.activityLogged(task.list.boardId, { activity });

    return { task: serializedTask };
  }
};