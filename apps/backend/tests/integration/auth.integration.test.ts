import request from 'supertest';
import { createApp } from '@/app.js';
import { prisma } from '@/config/prisma.js';
import { describeDb, resetDb } from '../helpers.js';

const app = createApp();

describeDb('auth integration', () => {
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

  it('supports signup, me, refresh, logout lifecycle', async () => {
    const signup = await request(app).post('/api/v1/auth/signup').send({
      name: 'Integration User',
      email: 'integration@example.com',
      password: 'SecurePass123!'
    });

    expect(signup.status).toBe(201);
    expect(signup.body.success).toBe(true);
    expect(signup.body.data.token).toBeDefined();
    expect(signup.body.data.refresh_token).toBeDefined();

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${signup.body.data.token}`);

    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('integration@example.com');

    const refresh = await request(app).post('/api/v1/auth/refresh').send({
      refresh_token: signup.body.data.refresh_token
    });

    expect(refresh.status).toBe(200);
    expect(refresh.body.data.token).toBeDefined();

    const logout = await request(app).post('/api/v1/auth/logout').send({
      refresh_token: refresh.body.data.refresh_token
    });

    expect(logout.status).toBe(200);

    const refreshAfterLogout = await request(app).post('/api/v1/auth/refresh').send({
      refresh_token: refresh.body.data.refresh_token
    });

    expect(refreshAfterLogout.status).toBe(401);
    expect(refreshAfterLogout.body.success).toBe(false);
  });
});
