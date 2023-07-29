import fs from "fs";
import * as path from 'path';
import { Oracle } from '../oracle';
import { generateTrees } from '../rebalancer';
import { getFile } from '../../utils';

export function Rebalance(oracle: Oracle): void {
  const contract = oracle.contract;
  const filter = contract.filters.Epoch();

  contract.on(filter, (epoch, withdrawals, exits, state) => {
    uploadStateIPFS(oracle, Number(epoch), state);
  });

  console.log("Listening to rebalance events");
}

export async function uploadStateIPFS(oracle: Oracle, epoch: number, root: string): Promise<void> {
  try {
    const pinata: any = oracle.pinata;

    if(root != `0x${oracle.db.root().toString('hex')}`) {
      throw "Error: IPFS not publishing files due to root mismatch";
    }

    await generateTrees(oracle.db);

    const withdrawals = getFile("withdrawals");
    const exits = getFile("exits");
    const state = await (await fetch(`http://127.0.0.1:${oracle.apiPort}/checkpoint`)).json();

    // Link parentHash CID
    let parentCID;
    const pin = await pinata.pinList({metadata: { name: `${epoch - 1}`}})
    pin.rows.length === 0 ? parentCID = 'N/A' : parentCID = pin.rows[0].ipfs_pin_hash;

    const opts = {
      pinataMetadata: {
        name: `${epoch}`,
      }
    }

    // Push withdrawals
    const reciept1 = await pinata.pinJSONToIPFS(withdrawals);
    // Push exit
    const reciept2 = await pinata.pinJSONToIPFS(exits);
    // Push top state
    state['withdrawals'] = reciept1.IpfsHash;
    state['exits'] = reciept2.IpfsHash;
    state['parentHash'] = parentCID;
    state['epoch'] = epoch;
    const reciept3 = await pinata.pinJSONToIPFS(state, opts);
    console.log(`State updated to IPFS with CID: ${reciept3.IpfsHash}`);
  } catch(err: any) {
    console.log(err);
  }
}

/*
   export async function simulateRebalance(
root: string, 
block: number,
oracle: Oracle 
) {
const poolAddr = oracle.network.pool;
const balance = await oracle.contract.provider.getBalance(poolAddr, block - 1); 

const { 
includedValidators, 
tRewards, 
tStake 
} = await processRebalance(oracle.db);

const total = balance.sub(tRewards.add(tStake));
const fee = await fundUsers(includedValidators, total, oracle.db);
console.log("event root:", root);
console.log("processed root:", await oracle.db.root());
}
*/
