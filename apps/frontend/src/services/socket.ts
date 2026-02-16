import { io, type Socket } from 'socket.io-client';

const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(wsUrl, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
};

export const joinBoardRoom = (boardId: string): void => {
  socket?.emit('join_board', { board_id: boardId });
};

export const leaveBoardRoom = (boardId: string): void => {
  socket?.emit('leave_board', { board_id: boardId });
};
