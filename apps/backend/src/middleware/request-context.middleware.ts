import type { NextFunction, Request, Response } from 'express';
import pinoHttp from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/config/logger.js';
import type { IncomingMessage, ServerResponse } from 'http';

const httpLogger = pinoHttp({
  logger,
  genReqId: (req: IncomingMessage, res: ServerResponse) => {
    const existing = (req as Request).headers['x-request-id'];
    const id = typeof existing === 'string' ? existing : uuidv4();
    res.setHeader('x-request-id', id);
    return id;
  },
  customProps: (req: IncomingMessage) => ({ 
    requestId: (req as Request & { id?: string }).id 
  })
});

export const requestLogger = httpLogger;

export const requestContext = (req: Request, _res: Response, next: NextFunction): void => {
  req.requestId = (req as Request & { id?: string }).id || uuidv4();
  const start = process.hrtime.bigint();

  resOnFinish(req, start);
  next();
};

const resOnFinish = (req: Request, start: bigint): void => {
  req.res?.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    logger.info({ 
      requestId: req.requestId, 
      method: req.method, 
      path: req.originalUrl, 
      durationMs 
    }, 'Request completed');
  });
};