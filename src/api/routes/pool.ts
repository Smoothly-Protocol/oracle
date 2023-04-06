import { Application, Request, Response } from 'express';
import { BigNumber, Contract } from 'ethers';
import { Oracle } from '../../oracle';

export async function PoolRoutes(app: Application, oracle: Oracle) {  
  app.get('/poolstats/:root', async (req: Request, res: Response): Promise<void> =>  {
      const root = req.params.root;

      let awaitingActivation: number = 0;
      let activated: number = 0; 
      let deactivated: number = 0; 
      let tMiss: number = 0;
      let tFee: number = 0;
      let tRewards: BigNumber = BigNumber.from("0");
      let tStake: BigNumber = BigNumber.from("0");

      const stream = await oracle.db.getStream();
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
          tRewards = tRewards.add(BigNumber.from(validator.rewards));
          tStake = tStake.add(BigNumber.from(validator.stake));
        })
        .on('end', fulfilled);
      });
      
      let tWithdrawals: BigNumber = await totalWithdrawals(oracle.contract);
      let tValue: BigNumber = tRewards.add(tWithdrawals);
      res.json({
        awaiting_activation: awaitingActivation,
        activated: activated,
        total_rewards: tRewards, 
        total_stake: tStake,
        total_value: tValue, 
        total_withdrawals: tWithdrawals,
        total_value_period: (await oracle.getBalance()).sub(tRewards.add(tStake)),
        total_miss: tMiss,
        total_fee: tFee  
      })
  });
}

async function totalWithdrawals(contract: Contract): Promise<BigNumber> {
  let tWithdrawals: BigNumber = BigNumber.from("0");
  const filter = contract.filters.RewardsWithdrawal();
  const withdrawals = await contract.queryFilter(filter);
  for(let w of withdrawals) {
    const x = w as any; 
    if(x.args[2] !== undefined){
      tWithdrawals =  tWithdrawals.add(x.args[2])
    }
  } 
  return tWithdrawals;
}
