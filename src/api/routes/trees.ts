import { Application, Request, Response } from 'express';
import { Oracle } from '../../oracle';
import fs from "fs";
import * as path from 'path';

export async function TreeRoutes(app: Application, oracle: Oracle) {
  app.get('/tree/:name', async (req: Request, res: Response): Promise<void> => {
    try {
      const name: string = req.params.name;
      const data: any = JSON.parse(
        fs.readFileSync(
          path.resolve(__dirname, `../../../.smoothly/${name}.json`),
          'utf8'
        )
      );
      res.json(data);
    } catch {
      res.json({
        status: 404,
        err: 'Tree not found' 
      })
    }
  })
}
