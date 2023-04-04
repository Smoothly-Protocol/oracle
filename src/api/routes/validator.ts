import { Application, Request, Response } from 'express';
import { DB } from '../../db';

export async function ValidatorRoutes(app: Application, db: DB) {  
  app.get(
    '/validator/:index', 
    async (req: Request, res: Response): Promise<void> => {
      const index = req.params.index;
      res.json({
        index: index
      })
  });
}
