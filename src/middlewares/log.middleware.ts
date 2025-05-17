import { Request, Response, NextFunction } from 'express';

import log from '../utils/logger';

const logRouting = (req: Request, res: Response, next: NextFunction) => {
  log.info(`[${req.method}] request from ${req.path} path.`);
  next();
};

export default logRouting;