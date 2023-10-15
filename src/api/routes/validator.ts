import { Application, Request, Response } from 'express';
import { Oracle } from '../../oracle';
import { getValidators } from '../../oracle/events/registers';
import { Validator, ValidatorInfo, Proofs } from '../../types';
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "fs";
import * as path from 'path';

export async function ValidatorRoutes(app: Application, oracle: Oracle) {  
  app.get('/validators/:eth1Addr', async (req: Request, res: Response): Promise<void> => {
    const eth1Addr = req.params.eth1Addr;
    const validators: any = [];

    try { 
      const data = await getValidators(eth1Addr, oracle);
      for(let validator of data) {
        const v = await oracle.db.get(Number(validator.validatorindex));
        if(v) {
          validators.push(v)
        } else {
          validators.push({ index: validator.validatorindex });
        }
      }
      res.json({
        data: validators
      })
    } catch(err: any) { 
      res.json({
        status: 500,
        err: 'NETWORK_ERROR'
      });
    }
  });
}

async function getProofs(eth1Addr: string): Promise<Proofs> {
  let proofs: Proofs = { withdrawals: [], exits: [] };
  const dataWithdrawals: any = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, "../../../.smoothly/withdrawals.json"),
      'utf8'
    )
  );
  const dataExits: any = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, "../../../.smoothly/withdrawals.json"),
      'utf8'
    )
  );
  
  // Get withdrawal proof 
  const withdrawals = StandardMerkleTree.load(dataWithdrawals);   
  for (const [i, v] of withdrawals.entries()) {
    if (v[0] === eth1Addr) {
      proofs.withdrawals = withdrawals.getProof(i);
      break;
    }
  }

  // Get exit proof 
  const exits = StandardMerkleTree.load(dataExits);   
  for (const [i, v] of exits.entries()) {
    if (v[0] === eth1Addr) {
      proofs.exits = exits.getProof(i);
      break;
    }
  }
  
  return proofs;
};
