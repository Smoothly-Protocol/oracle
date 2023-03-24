import EventSource from "eventsource";
import { Oracle } from '../oracle';
import { DB } from '../db';
import { Validator } from '../types';
import { Contract, utils } from 'ethers';
import { filterLogs } from "../utils";

export async function BlockListener(oracle: Oracle) {
  const beacon = oracle.network.beacon;
  const db = oracle.db;
  const contract = oracle.contract;
  const eth2 = new EventSource(`${beacon}/eth/v1/events?topics=finalized_checkpoint`);

  eth2.addEventListener('finalized_checkpoint', async (e)  => {
    const { epoch } = JSON.parse(e.data);	
    console.log("Processing epoch:", Number(e.data.slot));
    processEpoch(epoch, beacon, db, contract, false);
  });

  console.log("Listening for new finalized_checkpoints");
}

export async function processEpoch(
  epoch: number, 
  beacon: string, 
  db: DB,
  contract: Contract,
  syncing: boolean
)  {
  const { data } = await reqEpochSlots(epoch, beacon);

  console.log("Syncing epoch:", Number(epoch));

  // Fetch slots in parallel
  let promises: Promise<any>[] = [];
  for(let _slot of data) {
    const { slot, validator_index } = _slot;
    promises.push(reqSlotInfo(slot, beacon).then(async (s: any) => {
      if(s !== undefined) {
        const { block_number } = s.body.execution_payload;
        const logs = await Promise.all([filterLogs(block_number, contract)]);
        s["logs"] = logs[0];
        return s;
      } else {
        return {
          slot: slot, 
          proposer_index: validator_index,
          logs: []
        };
      }
    }))
  }
  const slots = await Promise.all(promises);

  for(let _slot of slots) { 
    const { proposer_index, body, logs } = _slot;

    // Process eth1 logs
    if(logs.length > 0) {
      console.log(logs);
    }

    // Process beacon state
    const validator = await db.get(proposer_index);
    if(validator) {
      body !== undefined ? 
        await validateSlot(validator, body, contract, db) : 
        await addMissedSlot(validator, db); 
    }
  }
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

export async function reqEpochCheckpoint(beacon: string): Promise<any> {
  const url = `${beacon}/eth/v1/beacon/states/head/finality_checkpoints`;	
  const headers = {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    }
  };
  const req = await fetch(url, headers);
  const res = await req.json();
  const epoch = res.data.finalized.epoch;
  return epoch;
}
