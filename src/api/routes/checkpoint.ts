import { Application, Request, Response } from 'express';
import { Oracle } from '../../oracle';
import { Validator } from '../../types';

export async function Checkpoint(app: Application, oracle: Oracle) {
  app.get('/checkpoint', async (req: Request, res: Response): Promise<void> => {
    try {
			let validators: Validator[] = [];
      const stream = await oracle.db.getStream();
      const root = await oracle.db.root();
      await new Promise((fulfilled) => { 
        stream
        .on('data', async (data: any) => {
          validators.push(JSON.parse(data.value.toString()));
				})
        .on('end', fulfilled);
      });
      res.json({
        root: root.toString('hex'),
				data: validators
			});
    } catch {
      res.json({
        status: 404,
        err: 'Checkpoint not found' 
      })
    }
  })
}
