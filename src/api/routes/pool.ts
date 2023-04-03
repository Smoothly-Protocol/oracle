import { Router, Request, Response } from 'express';

export const pool = Router();

pool.get('/poolstats', async (req: Request, res: Response): Promise<void> =>  {
  res.json({
    awaiting_activation: 0,
    activated: 0,
    deactivated: 0,
    total_value_period: 0, 
    average_value: 0,
    total_miss: 0,
    total_fee: 0  
  })
});
