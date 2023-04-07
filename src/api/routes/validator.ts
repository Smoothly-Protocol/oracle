import { Application, Request, Response } from 'express';
import { Oracle } from '../../oracle';
import { Validator, ValidatorInfo, Proofs } from '../../types';
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "fs";
import * as path from 'path';

export async function ValidatorRoutes(app: Application, oracle: Oracle) {  
  app.get('/validators/:eth1Addr', async (req: Request, res: Response): Promise<void> => {
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
