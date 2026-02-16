import http from 'http';
import request from 'supertest';
import { io as clientIO, type Socket } from 'socket.io-client';
import { createApp } from '@/app.js';
import { initWebSocket } from '@/websocket/connection.js';
import { prisma } from '@/config/prisma.js';
import { describeDb, resetDb } from '../helpers.js';

const waitForEvent = <T>(socket: Socket, event: string, timeoutMs = 2500): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeoutMs);

    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

describeDb('websocket events', () => {
  const app = createApp();
  const server = http.createServer(app);
  initWebSocket(server);
  let port = 0;

  beforeAll(async () => {
    await prisma.$connect();
    await resetDb();
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          port = address.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('emits user_joined and task_updated events', async () => {
    const signup = await request(app).post('/api/v1/auth/signup').send({
      name: 'Socket User',
      email: 'socket@example.com',
      password: 'SecurePass123!'
    });

    const token = signup.body.data.token as string;

    const board = await request(app)
      .post('/api/v1/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Realtime Board' });
    const boardId = board.body.data.board.id as string;

    const list = await request(app)
      .post(`/api/v1/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Do' });
    const listId = list.body.data.list.id as string;

    const task = await request(app)
      .post(`/api/v1/lists/${listId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Socket task' });
    const taskId = task.body.data.task.id as string;

    const socket = clientIO(`http://127.0.0.1:${port}`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false
    });

    await new Promise<void>((resolve, reject) => {
      socket.once('connect', () => resolve());
      socket.once('connect_error', (error) => reject(error));
    });

    const joinedPromise = waitForEvent<{ board_id: string }>(socket, 'user_joined');
    socket.emit('join_board', { board_id: boardId });

    const joined = await joinedPromise;
    expect(joined.board_id).toBe(boardId);

    const taskUpdatedPromise = waitForEvent<{ task_id: string }>(socket, 'task_updated');

    const update = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Socket task updated' });

    expect(update.status).toBe(200);

    const taskUpdated = await taskUpdatedPromise;
    expect(taskUpdated.task_id).toBe(taskId);

    socket.disconnect();
  });
});
