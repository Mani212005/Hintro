import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '@/config/env.js';
import { setIO } from '@/config/socket.js';
import { verifyToken } from '@/utils/jwt.js';
import { prisma } from '@/config/prisma.js';
import { websocketEmitter } from './events.js';

export const initWebSocket = (server: HttpServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      next(new Error('Authentication error'));
      return;
    }

    try {
      const user = verifyToken(token);
      socket.data.user = user;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_board', async ({ board_id }: { board_id: string }) => {
      const userId = socket.data.user?.id as string;
      const membership = await prisma.boardMember.findUnique({
        where: {
          boardId_userId: {
            boardId: board_id,
            userId
          }
        }
      });

      if (!membership) {
        return;
      }

      await socket.join(board_id);
      websocketEmitter.userJoined(board_id, {
        user: { id: userId, name: socket.data.user?.name },
        board_id
      });
    });

    socket.on('leave_board', async ({ board_id }: { board_id: string }) => {
       await socket.leave(board_id);
      websocketEmitter.userLeft(board_id, {
        user_id: socket.data.user?.id as string,
        board_id: board_id
      });
    });
  });

  setIO(io);
  return io;
};
