import EventSource from "eventsource";
import { setTimeout } from "timers/promises";
import { Oracle } from './oracle';
import { DB } from '../db';
import { Validator } from '../types';
import { Contract, utils } from 'ethers';
import { filterLogs, existsHead } from "../utils";
import { 
  verifyValidator, 
  validateExitRequest,
  validateWithdrawalRewards,
  validateWithdrawalStake,
  validateAddedStake,
} from "./events";
import { Rebalancer } from "./rebalancer";
import { uploadStateIPFS } from "./events/epoch";

export async function EpochListener(oracle: Oracle) {
  const eth2 = new EventSource(`${oracle.network.beacon}/eth/v1/events?topics=finalized_checkpoint`);
  let prevEpoch: number = 0;

  eth2.addEventListener('finalized_checkpoint', async (e)  => {
    try {
      let { epoch } = JSON.parse(e.data);	
      epoch = Number(epoch);

      // Process epochs including skipped ones
      while(prevEpoch < epoch) {
        let _epoch: number;  

        if(prevEpoch === 0 || (prevEpoch + 1) === epoch) {
          prevEpoch = epoch;
          _epoch = epoch;
        } else {
          _epoch = prevEpoch + 1;
          prevEpoch++;
        }

        console.log("Processing epoch:", _epoch);
        await processEpoch(_epoch, false, oracle);
      }

      // Check if rebalance is needed
      const contract = oracle.governance;
      const lastEpoch = await contract.lastEpoch();
      const epochInterval = await contract.epochInterval();
      const { timestamp } = await contract.provider.getBlock("latest");
      const timeLock = Number(lastEpoch) + Number(epochInterval);

      // Check contract timelock
      if(timeLock < timestamp) {
        const epochNumber = await contract.epochNumber();
        const voter = await oracle.signer.getAddress();
        const vote = await contract.votes(epochNumber, voter);

        // Process rebalance 
        if(vote[0] == 0) {
          Rebalancer(oracle);
        }
      } 
    } catch(err: any) {
      console.log(err);
    }
  });

  console.log("Listening for new finalized_checkpoints");
}

export async function processEpoch(
  epoch: number, 
  syncing: boolean,
  oracle: Oracle,
)  {
  try {
    const beacon = oracle.network.beacon;
    const db = oracle.db;
    const contract = oracle.contract;
    const checkpoint = syncing ? await reqEpochCheckpoint(beacon) : 0;
    const res = await reqEpochSlots(epoch, beacon);

    // Handle invalid epoch
    if(res.code) {
      throw `Code: ${res.code}, Message: ${res.message}`;
    } else if(syncing && epoch > Number(checkpoint)) {
      throw `Checkpoint reached`;
    }

    syncing ? console.log("Syncing epoch:", epoch) : 0;

    // Fetch slots in parallel
    let promises: Promise<any>[] = [];
    for(let _slot of res.data) {
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
      if(logs.length > 0 /*&& syncing*/) {
        for(let log of logs) {
          const event = log.event;
          const args = log.args;
          switch(event) {
            case 'Registered':
              await verifyValidator(args[0], args[1], oracle);
            break;
            case 'RewardsWithdrawal':
              await validateWithdrawalRewards(args[0], args[1], args[2], oracle);
            break;
            case 'StakeWithdrawal':
              await validateWithdrawalStake(args[0], args[1], args[2], oracle);
            break;
            case 'StakeAdded':
              await validateAddedStake(args[0], args[1], args[2], oracle);
            break;
            case 'ExitRequested':
              await validateExitRequest(args[0], args[1], oracle);
            break;
            case 'Epoch':
              if(oracle.pinata) {
              await uploadStateIPFS(oracle, Number(args[0]), args[3]);
            }
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

    // Check consensus with peers every hour or 10th epoch
    if(!syncing && (epoch % 10) === 0) {
      const _root: string = await db.root().toString('hex');
      const { root, peers, votes } = await oracle.p2p.startConsensus(_root, epoch);

      if(root === undefined) {
        console.log("Warning: no votes provided on checkpoint"); 
      } else if(root === null) {
        console.log("Operators didn't reach 2/3 of consensus offline");
        const data = existsHead()
        data ? await oracle.fullSync(Number(data.epoch) + 1) : 0;
      } else if(root === _root) {
        db.checkpoint(epoch);
        console.log(`Consensus reached and node in sync with root: ${root}`); 
        console.log(`Agreements: ${peers.length}/${votes.length}`);
      } else {
        console.log(`Consensus reached but node is not in sync with root: ${root}`); 
        console.log(`Agreements: ${peers.length}/${votes.length}`);
        console.log("Requesting sync from valid peers...");
        await oracle.p2p.requestSync(peers);
      } 
    } else if(syncing) {
      db.checkpoint(epoch);
    }
  } catch(err: any) {
    if(err == 'Checkpoint reached') {
      throw err;
    } else {
      console.log("Network connection error: retrying epoch", epoch);
      await setTimeout(1000);
      processEpoch(epoch, syncing, oracle);
    }
  }
}

async function voluntaryExits(data: any, db: DB) { 
  for(let exit of data) {
    const index = exit.message.validator_index;
    const validator = await db.get(index);
    if(validator) {
      validator.deactivated = true;
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
