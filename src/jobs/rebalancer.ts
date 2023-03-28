import { Contract, utils, BigNumber } from "ethers";
import { Validator, TrieRebalance } from "../types";
import { MISS_FEE, SLASH_FEE, FEE, STAKE_FEE } from "../utils";
import { Oracle } from "../oracle";
import { DB } from "../db";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

export async function Rebalancer (oracle: Oracle) {
    try {
      const contract = oracle.contract;
      const db = oracle.db;

      const { 
        includedValidators, 
        tRewards, 
        tStake 
      } = await processRebalance(db);
      
      const total = (await oracle.getBalance()).sub(tRewards.add(tStake));

      const fee = await fundUsers(includedValidators, total, db);
      const [withdrawalsRoot, exitsRoot] = await generateTrees(db);

      // Call to contract
      const tx = await contract.connect(oracle.signer).updateEpoch(
        withdrawalsRoot,
        exitsRoot,
        db.root(),
      );
      await tx.wait();
    } catch(err) {
      console.log(err);
    }
}

async function processRebalance(db: DB): Promise<TrieRebalance> {
  let tRewards: BigNumber = BigNumber.from("0");
  let tStake: BigNumber = BigNumber.from("0");
  let includedValidators: Validator[] = [];

  try { 
    const stream = await db.getStream();
    await new Promise((fulfilled) => { 
      stream
      .on('data', async (data: any) => {
        let validator = JSON.parse(data.value.toString());
        if(validator.slashFee !== 0 || validator.slashMiss !== 0) {
          validator = await slashValidator(validator, db);
        } else if(validator.active) {
          if(validator.stake > SLASH_FEE) {
            includedValidators.push(validator);
          }
        }

        tRewards = tRewards.add(validator.rewards);
        tStake = tStake.add(validator.stake);
      })
      .on('end', fulfilled);
    });
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
  try{
  if( isSlashed ) {
    const missedSlashes = MISS_FEE.mul(BigNumber.from(`${missedSlots}`));
    const feeSlashes = SLASH_FEE.mul(BigNumber.from(`${validator.slashFee}`));

    let tFees = missedSlashes.add(feeSlashes); 
    
    // Make sure user has enough stake
    validator.stake = BigNumber.from(validator.stake);
    if(validator.stake.lt(tFees)) {
      tFees = validator.stake; 
      validator.active = false;
    } 
    validator.stake = validator.stake.sub(tFees);
  }
  } catch(err) {
    console.log(err)
  }

  // Update db
  validator.slashFee = 0;
  validator.slashMiss = 0;
  await db.insert(validator.index, validator);

  return validator;
}

async function generateTrees(db: DB): Promise<string[]> {
  let withdrawals: Array<[string, BigNumber]> = [];
  let exits: Array<[string, BigNumber]> = [];
  try { 
    const stream = await db.getStream();
    await new Promise((fulfilled) => { 
      stream
      .on('data', async (data: any) => {
        let validator = JSON.parse(data.value.toString());
        withdrawals.push([validator.eth1, validator.rewards]);
        exits.push([validator.eth1, validator.stake]);
      })
      .on('end', fulfilled);
    });
    const withdrawalsRoot = StandardMerkleTree.of(
      withdrawals, 
      ["address", "uint256"]
    ).root;
    const exitsRoot = StandardMerkleTree.of(
      exits, 
      ["address", "uint256"]
    ).root;
    return [withdrawalsRoot, exitsRoot];
  } catch(err: any) {
    throw new Error(`Fail to generate Trees: ${err}`);
  }
}

async function fundUsers(includedValidators: Validator[], total: BigNumber, db: DB): Promise<BigNumber> {
  const _fee = total.mul(FEE).div(1000);
  const validatorShare = total.sub(_fee).div(includedValidators.length);
  for(let validator of includedValidators) {
    validator.rewards = BigNumber.from(validator.rewards).add(validatorShare);
    await db.insert(validator.index, validator);
    console.log(`Funded ${validator.index} with ${utils.formatEther(validatorShare)}`); 
  }
  return _fee;
}

