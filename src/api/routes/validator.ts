import { Application, Request, Response } from 'express';
import { Oracle } from '../../oracle';
import { Validator, ValidatorInfo } from '../../types';

export async function ValidatorRoutes(app: Application, oracle: Oracle) {  
  /*
  app.get('/validator/:index', async (req: Request, res: Response): Promise<void> => {
    const index = Number(req.params.index);
    const validator = await oracle.db.get(index);

    if(validator) {
      res.json(validator)
    } else {
      res.json({
        status: 404,
        msg: "Validator not found"
      })
    }
  });
 */

  app.get('/validator/:eth1Addr', async (req: Request, res: Response): Promise<void> => {
    const eth1Addr = req.params.eth1Addr;
    const registered: Validator[] = [];
    const unregistered: number[] = [];
    const url = `${oracle.network.beaconchainApi}/api/v1/validator/eth1/${eth1Addr}`;
    const headers = {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    }
    try { 
      const response = await (await fetch(url, headers)).json();
      if(response.status === "OK") {
        let data: Array<ValidatorInfo> = [];
        data = response.data.length != undefined ? response.data : data.push(response.data);
        for(let validator of data) {
          const v = await oracle.db.get(Number(validator.validatorindex));
          if(v) {
            registered.push(v);
          } else {
            unregistered.push(validator.validatorindex);
          }
        }
      }
      res.json({
        registered: registered,
        unregistered: unregistered
      })
    } catch { 
      res.json({
        status: 500,
        err: 'NETWORK_ERROR'
      });
    }
  });
}
