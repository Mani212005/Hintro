import 'dotenv/config';

import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Demo123!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@taskflow.com' },
    update: { name: 'Demo User', passwordHash },
    create: {
      name: 'Demo User',
      email: 'demo@taskflow.com',
      passwordHash
    }
  });

  const board = await prisma.board.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {
      title: 'Project Management',
      description: 'Example board with seeded tasks'
    },
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Project Management',
      description: 'Example board with seeded tasks',
      ownerId: user.id
    }
  });

  await prisma.boardMember.upsert({
    where: {
      boardId_userId: {
        boardId: board.id,
        userId: user.id
      }
    },
    update: { role: 'admin' },
    create: { boardId: board.id, userId: user.id, role: 'admin' }
  });

  const listTodo = await prisma.list.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: { title: 'To Do', position: 0 },
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'To Do',
      position: 0,
      boardId: board.id
    }
  });

  await prisma.list.upsert({
    where: { id: '33333333-3333-3333-3333-333333333333' },
    update: { title: 'In Progress', position: 1 },
    create: {
      id: '33333333-3333-3333-3333-333333333333',
      title: 'In Progress',
      position: 1,
      boardId: board.id
    }
  });

  await prisma.task.upsert({
    where: { id: '44444444-4444-4444-4444-444444444444' },
    update: { title: 'Setup project architecture', position: 0 },
    create: {
      id: '44444444-4444-4444-4444-444444444444',
      title: 'Setup project architecture',
      description: 'Bootstrap backend and define initial modules',
      position: 0,
      listId: listTodo.id,
      createdById: user.id
    }
  });

  console.log('Seed complete');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
