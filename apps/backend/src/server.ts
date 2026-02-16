import http from 'http';
import { createApp } from './app.js';
import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { initWebSocket } from '@/websocket/connection.js';

console.log("FRONTEND_URL:", env.FRONTEND_URL);
const app = createApp();

const server = http.createServer(app);

initWebSocket(server);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Server listening');
});
