import { Application, Request, Response } from 'express';
import { BigNumber } from 'ethers';
import { DB } from '../../db';

export async function PoolRoutes(app: Application, db: DB) {  
  app.get('/poolstats/:root', async (req: Request, res: Response): Promise<void> =>  {
      const root = req.params.root;

      let awaitingActivation: number = 0;
      let activated: number = 0; 
      let deactivated: number = 0; 
      let tMiss: number = 0;
      let tFee: number = 0;
      let tValue: BigNumber = BigNumber.from("0");
      let tStake: BigNumber = BigNumber.from("0");

      const stream = await db.getStream();
      await new Promise((fulfilled) => { 
        stream
        .on('data', async (data: any) => {
          let validator = JSON.parse(data.value.toString());
          if(deactivated) {
            deactivated++;
          } else if (validator.firstBlockProposed) {
            activated++;
          } else {
            awaitingActivation++;
          }
          tMiss += validator.slashMiss;
          tFee += validator.slashFee;
          tValue = tValue.add(BigNumber.from(validator.rewards));
          tStake = tValue.add(BigNumber.from(validator.stake));
        })
        .on('end', fulfilled);
      });

      res.json({
        awaiting_activation: awaitingActivation,
        activated: activated,
        total_value: tValue, 
        total_stake: tStake,
        total_miss: tMiss,
        total_fee: tFee  
      })
  });
}
