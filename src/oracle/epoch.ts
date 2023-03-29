import EventSource from "eventsource";
import { Oracle } from './oracle';
import { DB } from '../db';
import { Validator } from '../types';
import { Contract, utils } from 'ethers';
import { filterLogs } from "../utils";
import { 
  verifyValidator, 
  validateExitRequest,
  validateWithdrawalRewards,
  validateWithdrawalStake,
  validateAddedStake
} from "./events";

export async function EpochListener(oracle: Oracle) {
  const eth2 = new EventSource(`${oracle.network.beacon}/eth/v1/events?topics=finalized_checkpoint`);

  eth2.addEventListener('finalized_checkpoint', async (e)  => {
    const { epoch } = JSON.parse(e.data);	
    console.log("Processing epoch:", Number(e.data.slot));
    processEpoch(epoch, oracle);
  });

  console.log("Listening for new finalized_checkpoints");
}

export async function processEpoch(
  epoch: number, 
  oracle: Oracle,
)  {
  const beacon = oracle.network.beacon;
  const db = oracle.db;
  const contract = oracle.contract;
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
      for(let log of logs) {
        const event = log.event;
        const args = log.args;
        switch(event) {
          case 'Registered':
            await verifyValidator(args[0], args[1], oracle);
            break;
          case 'RewardsWithdrawal':
            await validateWithdrawalRewards(args[0], args[1], oracle);
            break;
          case 'StakeWithdrawal':
            await validateWithdrawalStake(args[0], args[1], oracle);
            break;
          case 'StakeAdded':
            await validateAddedStake(args[0], args[1], oracle);
            break;
          case 'ExitRequested':
            await validateExitRequest(args[0], args[1], oracle);
            break;
          case 'Epoch':
            break;
        }  
      }
    }

    //Process voluntary_exit
    if(body && body.voluntary_exits.length > 0) {
      await voluntaryExits(body.voluntary_exits, db);
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

async function voluntaryExits(data: any, db: DB) { 
  for(let exit of data) {
    const index = exit.message.validator_index;
    const validator = await db.get(index);
    if(validator) {
      validator.active = false;
      await db.insert(index, validator);
      console.log("Voluntary exit: validator with index", index);
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
