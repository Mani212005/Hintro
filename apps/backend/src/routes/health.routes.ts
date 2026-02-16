import { Router } from 'express';
import { prisma } from '@/config/prisma.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
});

healthRouter.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, data: { status: 'ready' } });
  } catch {
    res.status(503).json({
      success: false,
      error: {
        code: 'NOT_READY',
        message: 'Database connection failed',
        details: []
      }
    });
  }
});
