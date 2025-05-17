import { Request, Response } from 'express';

const healthCheck = (req: Request, res: Response) => {
  res.send('ok');
};

export default healthCheck;