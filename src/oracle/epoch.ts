import EventSource from "eventsource";
import { setTimeout } from "timers/promises";
import { Oracle } from './oracle';
import { DB } from '../db';
import { Validator } from '../types';
import { Contract, utils, BigNumber } from 'ethers';
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
import { logger } from "../utils";

const MAX_RETRYS = 5;
let retries = 0;
let prevEpoch: number = 0;

export async function EpochListener(oracle: Oracle) {
    oracle.event = new EventSource(`${oracle.network.beacon}/eth/v1/events?topics=finalized_checkpoint`);

    oracle.event.addEventListener('finalized_checkpoint', async (e)  => {
      try {
        let lastSlot;
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

          logger.info(`Processing epoch - epoch=${_epoch}`);
          lastSlot = await processEpoch(_epoch, false, oracle);
          
          if(!lastSlot) throw "Couldn't find lastSlot";

          // Check if rebalance is needed
          const { timestamp, prev_randao, block_number} = lastSlot.body.execution_payload;
          const contract = oracle.governance;
          const lastEpoch = await contract.lastEpoch();
          const epochInterval = await contract.epochInterval();
          const operators = await contract.getOperators();
          const timeLock = Number(lastEpoch) + Number(epochInterval);

          // Check contract timelock
          if(timeLock < timestamp) {
            const epochNumber = await contract.epochNumber();
            const voter = await oracle.signer.getAddress();
            const vote = await contract.votes(epochNumber, voter);

            // Process rebalance 
            if(vote == 0) {
              const random = Math.floor(
                ((Number(prev_randao) % 100) / 100) * operators.length
              );
              const shuffle = operators.slice(random -1).concat(operators.slice(0, random -1));
              const priority = shuffle.indexOf(voter);

              priority !== -1 
                ? Rebalancer(oracle, { block_number, priority })
                : 0;
            }
          } 
        }
      } catch(err:any) {
        logger.error(err);
      }
    });

    logger.info("Listening for new finalized_checkpoints");
}

export async function processEpoch(
  epoch: number, 
  syncing: boolean,
  oracle: Oracle,
): Promise<any>  {
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

    syncing ? logger.info(`Syncing epoch - epoch=${epoch}`) : 0;

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
              await uploadStateIPFS(oracle, Number(args[0]), args[1]); 
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
        logger.warn("no votes provided on checkpoint"); 
      } else if(root === null) {
        logger.warn("Operators didn't reach 2/3 of consensus offline");
        const data = existsHead()
        data ? await oracle.fullSync(Number(data.epoch) + 1) : 0;
      } else if(root === _root) {
        db.checkpoint(epoch);
        logger.info(`Consensus reached and node in sync with root - root=${root} - agreements=${peers.length}/${votes.length}`); 
      } else {
        logger.warn(`Consensus reached but node is not in sync with root - root=${root} - agreements: ${peers.length}/${votes.length}`); 
        logger.info("Requesting sync from valid peers...");
        await oracle.p2p.requestSync(peers);
      } 
    } else if(syncing) {
      db.checkpoint(epoch);
    }

    return findLastSlot(slots);
  } catch(err: any) {
    if(err == 'Checkpoint reached') {
      throw err;
    } else {
      if(retries >= MAX_RETRYS) {
        retries = 0;
        await oracle.checkConnectivity(true);
      } else {
        logger.error(`Network connection error - retrying epoch - epoch=${epoch} - err=${err}`);
        await setTimeout(5000);
        retries++;
      }
      return await processEpoch(epoch, syncing, oracle);
    }
  }
}

function findLastSlot(slots: any): any {
  let lastSlot: any = slots[slots.length -1];
  if(lastSlot.body) {
    return lastSlot;
  }
  slots.pop();
  return findLastSlot(slots);
}

async function voluntaryExits(data: any, db: DB) { 
  for(let exit of data) {
    const index = exit.message.validator_index;
    const validator = await db.get(index);
    if(validator) {
      if(!validator.firstBlockProposed) {
        // Zero out validator
        validator.rewards = BigNumber.from("0");
        logger.info(`Zero out - validator_index=${validator.index}`);
      }
      validator.exitRequested = true;
      await db.insert(index, validator);
      logger.info(`Voluntary exit - validator_index=${index}`);
    }
  }
}

async function addMissedSlot(validator: Validator, db: DB) {
  validator.slashMiss += 1;
  await db.insert(validator.index, validator);
  logger.info(`Missed proposal - validator_index=${validator.index}`);
}

export async function validateSlot(
  validator: Validator, 
  body: any, 
  contract: Contract, 
  db: DB
) {
  const { fee_recipient, block_hash } = body.execution_payload;
  const block: any = await contract.provider.getBlockWithTransactions(block_hash);
  const lastTx: any = block.transactions[block.transactions.length - 1];
  const pool: string = contract.address.toLowerCase();

  // Check builder not swapping address
  if( 
     (fee_recipient.toLowerCase() != pool) && 
     (lastTx.to.toLowerCase() != pool) &&
     (!lastTx.data.toLowerCase().includes(pool.slice(2)))
    ) 
    {
      validator.slashFee += 1;
      logger.info(`Proposed block with incorrect fee recipient - validator_index=${validator.index}`);
    } else { 
      // Activation
      if(!validator.firstBlockProposed) {
        validator.firstBlockProposed = true
        logger.info(`Activated - validator_index=${validator.index}`);
      } 
      logger.info(`Proposed block - validator_index=${validator.index}`);
    }
    await db.insert(validator.index, validator)
}

export async function reqSlotInfo(slot: number, beacon: string): Promise<any> {
  try {
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
  } catch {
    throw 'Beacon node not responding';
  }
}

export async function reqEpochSlots(epoch: number, beacon: string): Promise<any> {
  try {
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
  } catch {
    throw 'Beacon node not responding';
  }
}

export async function reqEpochCheckpoint(beacon: string): Promise<any> {
  try {
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
  } catch {
    throw 'Beacon node not responding';
  }
}
