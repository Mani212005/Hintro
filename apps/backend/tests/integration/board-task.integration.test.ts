import request from 'supertest';
import { createApp } from '@/app.js';
import { prisma } from '@/config/prisma.js';
import { describeDb, resetDb } from '../helpers.js';

jest.mock('@/websocket/events.js', () => ({
  websocketEmitter: {
    boardUpdated: jest.fn(),
    taskCreated: jest.fn(),
    taskUpdated: jest.fn(),
    taskDeleted: jest.fn(),
    taskMoved: jest.fn(),
    activityLogged: jest.fn(),
  }
}));

const app = createApp();

const signupAndToken = async () => {
  const response = await request(app).post('/api/v1/auth/signup').send({
    name: 'Board User',
    email: 'board-user@example.com',
    password: 'SecurePass123!'
  });

  return response.body.data.token as string;
};

describeDb('board and task integration', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it('creates board, list, task, move and searches', async () => {
    const token = await signupAndToken();

    const board = await request(app)
      .post('/api/v1/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Project Alpha', description: 'Main project board' });

    expect(board.status).toBe(201);
    const boardId = board.body.data.board.id as string;

    const listTodo = await request(app)
      .post(`/api/v1/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Do', position: 0 });

    const listDoing = await request(app)
      .post(`/api/v1/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'In Progress', position: 1 });

    expect(listTodo.status).toBe(201);
    expect(listDoing.status).toBe(201);

    const todoId = listTodo.body.data.list.id as string;
    const doingId = listDoing.body.data.list.id as string;

    const task = await request(app)
      .post(`/api/v1/lists/${todoId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Implement auth', position: 0 });

    expect(task.status).toBe(201);
    const taskId = task.body.data.task.id as string;

    const move = await request(app)
      .patch(`/api/v1/tasks/${taskId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ list_id: doingId, position: 0 });

    expect(move.status).toBe(200);
    expect(move.body.data.task.list_id).toBe(doingId);

    const activity = await request(app)
      .get(`/api/v1/boards/${boardId}/activity?page=1&limit=20`)
      .set('Authorization', `Bearer ${token}`);

    expect(activity.status).toBe(200);
    expect(activity.body.data.activities.length).toBeGreaterThan(0);

    const search = await request(app)
      .get(`/api/v1/search?query=auth&board_id=${boardId}&type=task&page=1&limit=20`)
      .set('Authorization', `Bearer ${token}`);

    expect(search.status).toBe(200);
    expect(search.body.data.results.length).toBeGreaterThan(0);
  });
});
