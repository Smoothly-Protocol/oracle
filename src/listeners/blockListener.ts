import EventSource from "eventsource";
import { Oracle } from '../oracle';
import { DB } from '../db';
import { Validator } from '../types';
import { Contract } from 'ethers';

export async function BlockListener(oracle: Oracle) {
  const beacon = oracle.network.beacon;
  const db = oracle.db;
  const contract = oracle.contract;
  const eth2 = new EventSource(`${beacon}/eth/v1/events?topics=finalized_checkpoint`);

  eth2.addEventListener('finalized_checkpoint', async (e)  => {
    const { epoch } = JSON.parse(e.data);	
    const { data } = await reqEpochSlots(epoch, beacon);

    console.log("Processing epoch:", Number(epoch));

    for(let i = 0; i < data.length; i++) {
      const { slot, validator_index } = data[i];
      const validator = await oracle.db.get(validator_index);
      if(validator) {
        const res = await reqSlotInfo(slot, beacon);
        res !== undefined ? 
          await validateSlot(validator, res.body, contract, db) : 
          await addMissedSlot(validator, db); 
      }
    }
  });
  console.log("Listening for new finalized_checkpoints");
}

async function addMissedSlot(validator: Validator, db: DB) {
    validator.slashMiss += 1;
    await db.insert(validator.index, validator);
    console.log(`Missed proposal: validator with index ${validator.index}`);
}

async function validateSlot(
  validator: Validator, 
  body: any, 
  contract: Contract, 
  db: DB
) {
  const { fee_recipient, block_hash } = body.execution_payload;
  const block: any = await contract.provider.getBlockWithTransactions(block_hash);

  // Check builder not swapping address
  if( (fee_recipient.toLowerCase() != contract.address.toLowerCase()) && 
     (block.transactions[block.transactions.length - 1].to.toLowerCase() != contract.address.toLowerCase())) 
    {
      validator.slashFee += 1;
      console.log(`Proposed block with incorrect fee recipient: validator with index ${validator.index}`);
    } else { 
      // Activation
      if(!validator.firstBlockProposed) {
        validator.firstBlockProposed = true
        console.log(`Activated: validator with index ${validator.index}`);
      } 
      console.log(`Proposed block: validator with index ${validator.index}`);
    }
  await db.insert(validator.index, validator)
}

async function reqSlotInfo(slot: number, beacon: string): Promise<any> {
  const url = `${beacon}/eth/v2/beacon/blocks/${slot}`;	
  const headers = {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    }
  };
  const req = await fetch(url, headers);
  const res = await req.json();
  return res.code === 404 ? undefined : res.data.message;
}

async function reqEpochSlots(epoch: number, beacon: string): Promise<any> {
  const url = `${beacon}/eth/v1/validator/duties/proposer/${epoch}`;	
  const headers = {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    }
  };
  const req = await fetch(url, headers);
  const res = await req.json();
  return res;
}

