import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { boardRouter } from './board.routes.js';
import { listRouter } from './list.routes.js';
import { taskRouter } from './task.routes.js';
import { searchRouter } from './search.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/boards', boardRouter);
apiRouter.use('/lists', listRouter);
apiRouter.use('/tasks', taskRouter);
apiRouter.use('/search', searchRouter);
