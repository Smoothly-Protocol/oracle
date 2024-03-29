import fs from "fs";
import * as path from 'path';
import { homedir } from 'os';
import { Contract, utils, BigNumber } from "ethers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { Validator, TrieRebalance } from "../types";
import { MISS_FEE, SLASH_FEE, FEE, STAKE_FEE, logger } from "../utils";
import { DEFAULTS } from '../config';
import { Oracle } from "./oracle";
import { DB } from "../db";
import { setTimeout } from "timers/promises";

export async function Rebalancer (oracle: Oracle, data: any) {
  try {
    const contract = oracle.governance;
    const db = oracle.db;

    const { 
      includedValidators, 
      tRewards, 
      tStake 
    } = await processRebalance(db);

    const total = (await oracle.getBalance(data.block_number)).sub(tRewards.add(tStake));
    const fee = await fundUsers(includedValidators, total, db);

    const [withdrawalsRoot, exitsRoot] = await generateTrees(db);

    logger.debug(`total_rewards=${utils.formatEther(tRewards)} - total_stake=${utils.formatEther(tStake)}`);
    logger.info(`
      rewards_distributed=${utils.formatEther(total)} - 
      included_validators=${includedValidators.length} - 
      operator_fee=${utils.formatEther(fee)}
    `);

    // Propose Epoch to governance contract  
    const epochData = [withdrawalsRoot, exitsRoot, db.root(), fee];
    proposeEpoch(epochData, oracle, data.priority);
  } catch(err) {
    logger.error(err);
  }
}

export async function proposeEpoch(epochData: any, oracle: Oracle, priority: number): Promise<void> {
  try {
    // Random priority to avoid failed tx
    await setTimeout((priority * 40) * 1000);

    // Submit vote 
    const contract = oracle.governance;
    await contract.connect(oracle.signer).estimateGas.proposeEpoch(epochData);
    const tx = await contract.connect(oracle.signer).proposeEpoch(epochData, {gasLimit: 300000});
    await tx.wait();

    logger.info(`Vote proposed - root=${epochData[2].toString('hex')}`);
  } catch(err: any) {
    // EpochTimelockNotReached() selector error
    if(err.toString().includes('0xa6339a86')) {
      logger.info("Transaction reverted: Other nodes already reached consensus");
    } else if(err.toString().includes('0x82b42900')){
      // Unauthorized() selector error
      logger.warn("Unauthorized address to propose vote");
    } else {
      logger.info("Proposing epoch, trying again...")
      logger.warn("Please, make sure your address is funded")
      proposeEpoch(epochData, oracle, priority);
    }
  }
}

export async function processRebalance(db: DB): Promise<TrieRebalance> {
  let tRewards: BigNumber = BigNumber.from("0");
  let tStake: BigNumber = BigNumber.from("0");
  let validators: Validator[] = [];
  let includedValidators: Validator[] = [];

  try { 
    const stream = await db.getStream();
    await new Promise((fulfilled) => { 
      stream
      .on('data', async (data: any) => {
        validators.push(JSON.parse(data.value.toString()));
      })
      .on('end', fulfilled);
    });

    for(let validator of validators) {
      if(validator.slashFee !== 0 || validator.slashMiss !== 0) {
        validator = await slashValidator(validator, db);
        logger.info(`Excluded - validator_index=${validator.index}`);
      } else if(validator.active && !validator.excludeRebalance) {
        if(BigNumber.from(validator.stake).eq(SLASH_FEE)) {
          includedValidators.push(validator);
        }
      }

      if(validator.excludeRebalance) {
        validator.excludeRebalance = false;
        await db.insert(validator.index, validator);
        logger.info(`Excluded - validator_index=${validator.index}`);
      }

      tRewards = tRewards.add(validator.rewards);
      tStake = tStake.add(validator.stake);
    }

    return { includedValidators, tRewards, tStake };
  } catch(err: any) {
    throw new Error(`Rebalance failed on iterator with: ${err}`);
  }
}

async function slashValidator(validator: Validator, db: DB): Promise<Validator> {
  let isSlashed: boolean = false;
  let missedSlots: number = 0;

  if(!validator.firstBlockProposed) {
    // Zero out validator
    validator.rewards = BigNumber.from("0");
    logger.info(`Zero out - validator_index=${validator.index}`);
  } else {
    // Skip first missed proposal only for active users
    if(validator.firstMissedSlot) {
      isSlashed = true;
      missedSlots = validator.slashMiss;
    } else { 
      missedSlots = validator.slashMiss !== 0 
        ? validator.slashMiss - 1 
        : validator.slashMiss;
        if(missedSlots > 0 || validator.slashFee > 0) {
          isSlashed = true;
        }
        if(validator.slashMiss > 0) {
          validator.firstMissedSlot = true;	
        }
    }
  }

  // Calculate eth to slash
  if( isSlashed ) {
    const missedSlashes = MISS_FEE.mul(BigNumber.from(`${missedSlots}`));
    const feeSlashes = SLASH_FEE.mul(BigNumber.from(`${validator.slashFee}`));

    let tFees = missedSlashes.add(feeSlashes); 

    // Make sure user has enough stake
    validator.stake = BigNumber.from(validator.stake);
    if(validator.stake.lte(tFees)) {
      tFees = validator.stake; 
      validator.deactivated = true;
      validator.active = false;
    } 
    validator.stake = validator.stake.sub(tFees);
    logger.info(`Slashed - validator_index=${validator.index} - amount=${utils.formatEther(tFees)}`);
  }

  // Update db
  validator.slashFee = 0;
  validator.slashMiss = 0;
  await db.insert(validator.index, validator);

  return validator;
}

export async function generateTrees(db: DB): Promise<string[]> {
  let withdrawals: Array<[string, number, BigNumber]> = [];
  let exits: Array<[string, number, BigNumber]> = [];
  try { 
    const stream = await db.getStream();
    await new Promise((fulfilled) => { 
      stream
      .on('data', async (data: any) => {
        let validator = JSON.parse(data.value.toString());
        if(BigNumber.from(validator.rewards).gt(0) && validator.firstBlockProposed) {
          withdrawals.push([validator.eth1, validator.index, validator.rewards]);
        } 
        if(validator.exitRequested) {
          // Handle the rewards 
          exits.push([validator.eth1, validator.index, validator.stake]);
          validator.active = false;
          await db.insert(validator.index, validator);
        }
      })
      .on('end', fulfilled);
    });
    const emptyTree = [["0x0000000000000000000000000000000000000000", [0], BigNumber.from("0")]];
    const withdrawalsTree = StandardMerkleTree.of(
      withdrawals.length > 0 ? packValidators(withdrawals, []) : emptyTree,
      ["address", "uint[]", "uint"]
    );
    const exitsTree = StandardMerkleTree.of(
      exits.length > 0 ? packValidators(exits, []) : emptyTree,
      ["address", "uint[]", "uint"]
    );

    // Write to disk
    fs.writeFileSync(
      path.resolve(homedir(), ".smoothly/withdrawals.json"), 
      JSON.stringify(withdrawalsTree.dump())
    )
    fs.writeFileSync(
      path.resolve(homedir(), ".smoothly/exits.json"), 
      JSON.stringify(exitsTree.dump())
    )
    return [withdrawalsTree.root, exitsTree.root];
  } catch(err: any) {
    throw new Error(`Fail to generate Trees: ${err}`);
  }
}

export async function fundUsers(includedValidators: Validator[], total: BigNumber, db: DB): Promise<BigNumber> {
  try { 
    if(total.lte(utils.parseEther("0"))) {
      return BigNumber.from("0");
    } else if(includedValidators.length < 1) {
      throw "No validators available for rebalance";
    }
    const _fee = total.mul(FEE).div(1000);
    const validatorShare = total.sub(_fee).div(includedValidators.length);
    for(let validator of includedValidators) {
      validator.rewards = BigNumber.from(validator.rewards).add(validatorShare);
      await db.insert(validator.index, validator);
      logger.info(`Funded - validator_index=${validator.index} - amount=${utils.formatEther(validatorShare)}`); 
    }
    return _fee;
  } catch (err: any) {
    throw err;
  }
}

function packValidators(
  validators: Array<[string, number, BigNumber]>,
  result: Array<[string, number[], BigNumber]>
) 
: Array<[string, number[], BigNumber]> {

  if(validators.length === 0) {
    // Sorting indexes to avoid different tree hashes
    for(let i = 0; i < result.length; i++) {
      result[i][1] = result[i][1].sort((a, b) => { return a - b});
    }
    return result;
  }

  let arr: number[] = [validators[0][1]]; 
  result.push([validators[0][0], arr, BigNumber.from(validators[0][2])]) ;
  validators.splice(0,1);

  let tmp = [...validators]
  let pos = result.length - 1;
  for(let x = 0; x < validators.length; x++) {
    if(result[pos][0] === validators[x][0]) {
      result[pos][1].push(validators[x][1]);
      result[pos][2] = result[pos][2].add(validators[x][2]);
      for(let i = 0; i < tmp.length; i++) {
        if(tmp[i] === validators[x]){
          tmp.splice(i,1);
          break;
        }
      }
    }
  }

  return packValidators(tmp, result);
}
