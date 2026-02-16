import { prisma } from '@/config/prisma.js';

export const dbEnabled = process.env.ENABLE_DB_TESTS === 'true';

export const describeDb = dbEnabled ? describe : describe.skip;

export const resetDb = async (): Promise<void> => {
  await prisma.activity.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.list.deleteMany();
  await prisma.boardMember.deleteMany();
  await prisma.board.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
};
