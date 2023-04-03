import { Router, Request, Response } from 'express';

export const validator = Router();

validator.get(
  '/validator/:index', 
  async (req: Request, res: Response): Promise<void> => {
    const index = req.params.index;
    res.json({
      index: index
    })
});
