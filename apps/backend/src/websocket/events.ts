import { z } from 'zod';
import { getIO } from '@/config/socket.js';

const boardUpdatedSchema = z.object({
  board_id: z.string().uuid(),
  changes: z.record(z.unknown())
});

const taskCreatedSchema = z.object({
  task: z.record(z.unknown()),
  list_id: z.string().uuid()
});

const taskUpdatedSchema = z.object({
  task_id: z.string().uuid(),
  changes: z.record(z.unknown())
});

const taskDeletedSchema = z.object({
  task_id: z.string().uuid(),
  list_id: z.string().uuid()
});

const taskMovedSchema = z.object({
  task_id: z.string().uuid(),
  from_list: z.string().uuid(),
  to_list: z.string().uuid(),
  position: z.number().int().nonnegative()
});

const activityLoggedSchema = z.object({
  activity: z.record(z.unknown())
});

const userJoinedSchema = z.object({
  user: z.object({ id: z.string().uuid(), name: z.string().optional() }),
  board_id: z.string().uuid()
});

const userLeftSchema = z.object({
  user_id: z.string().uuid(),
  board_id: z.string().uuid()
});

const emitToBoard = <T>(boardId: string, event: string, payload: T, schema: z.ZodSchema<T>): void => {
  schema.parse(payload);
  getIO().to(boardId).emit(event, payload);
};

export const websocketEmitter = {
  boardUpdated: (boardId: string, payload: z.infer<typeof boardUpdatedSchema>): void =>
    emitToBoard(boardId, 'board_updated', payload, boardUpdatedSchema),
  taskCreated: (boardId: string, payload: z.infer<typeof taskCreatedSchema>): void =>
    emitToBoard(boardId, 'task_created', payload, taskCreatedSchema),
  taskUpdated: (boardId: string, payload: z.infer<typeof taskUpdatedSchema>): void =>
    emitToBoard(boardId, 'task_updated', payload, taskUpdatedSchema),
  taskDeleted: (boardId: string, payload: z.infer<typeof taskDeletedSchema>): void =>
    emitToBoard(boardId, 'task_deleted', payload, taskDeletedSchema),
  taskMoved: (boardId: string, payload: z.infer<typeof taskMovedSchema>): void =>
    emitToBoard(boardId, 'task_moved', payload, taskMovedSchema),
  activityLogged: (boardId: string, payload: z.infer<typeof activityLoggedSchema>): void =>
    emitToBoard(boardId, 'activity_logged', payload, activityLoggedSchema),
  userJoined: (boardId: string, payload: z.infer<typeof userJoinedSchema>): void =>
    emitToBoard(boardId, 'user_joined', payload, userJoinedSchema),
  userLeft: (boardId: string, payload: z.infer<typeof userLeftSchema>): void =>
    emitToBoard(boardId, 'user_left', payload, userLeftSchema)
};
