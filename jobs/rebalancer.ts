import * as cron from "node-cron";
import * as dotenv from 'dotenv';
import * as path from 'path';

import { providers, Contract, utils, BigNumber, Wallet } from "ethers";

// DB
import { collections } from "../db/src/database.service";
import User from "../db/models/user";

// Load Environment variables
dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

const pk = process.env.PRIVATE_KEY as string;
const FEE = 25; // 2.5% Protocol_fee on rebalance
const SLASH_FEE = utils.parseEther("0.05");
const MISSED_PROPOSAL_FEE = utils.parseEther("0.015");

export async function startRebalancerCron (contract: Contract) {
  cron.schedule('* * * * *', async () => {
    if(collections.users != undefined) {

      const validUsers = await collections.users.find({
        slashFee: { $eq: 0 } ,
        missedSlots: { $eq: 0 } 
      }).toArray();

      const slashedUsers = await collections.users.find({
        $or: [
          {slashFee: { $gt: 0 }},
          {missedSlots: { $gt: 0 }} 
        ]
      }).toArray();

      const total = await contract.getRebalanceRewards();
      console.log("Total", total);

      if(total.gt(utils.parseEther("0.0001")) && validUsers.length > 0) {
        let [usersSlashed, slashedEth] = await slashUsers(slashedUsers, contract);
        let [usersIncluded, fee] = await fundUsers(validUsers, total.add(slashedEth), contract);
        let obj: any = usersIncluded.concat(usersSlashed);

        console.log("Total slashed ETH", slashedEth); 
        // Call rebalance in contract
        try {
          const signer = new Wallet(pk, contract.provider);
          const tx = await contract.connect(signer).rebalanceRewards(obj, fee);
        } catch(err) {
          console.log(err);
        }
      } else {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        console.log(`Didn't recieve any block rewards for today ${currentTimestamp}`);
      }
    }
  });
}

async function includeValidUsers(users: Array<User>, contract: Contract): Promise<any> {
  let obj = [];
  for(let user of users) {
    const stakePosition = await contract.getValidatorStake(user.eth1Addr, user.validatorId);
    if(stakePosition > SLASH_FEE) {
      obj.push(user);	
    }
  }
  return obj;
}

async function fundUsers(users: Array<any>, total: BigNumber, contract: Contract): Promise<any> {
  const validUsers = await includeValidUsers(users, contract);
  const _fee = total.mul(FEE).div(1000);
  console.log(_fee);
  const userShare = total.sub(_fee).div(validUsers.length);
  let obj = [];
  for(let user of validUsers) {
    obj.push([user.eth1Addr, user.validatorId, userShare, 0, 0, user.firstBlockProposed]);
    console.log(`Funded ${user.pubKey} with ${utils.formatEther(userShare)}`); 
  }
  return [obj, _fee];
}


async function slashUsers(users: Array<any>, contract: Contract): Promise<any> {
  let obj = [];
  let tSlashes: BigNumber = BigNumber.from("0");
  let tRewards: BigNumber = BigNumber.from("0");

  for(let user of users) {
    const validator = await contract.getValidator(user.eth1Addr, user.validatorId);
    let isSlashed = false;

    // Skip first missed proposal only for active users
    if(!user.firstBlockProposed) {
      // Zero out user
      obj.push([user.eth1Addr, user.validatorId, 0, user.missedSlots, user.slashFee, user.firstBlockProposed]);
      tRewards = tRewards.add(validator[1]);
    } else {
      if(user.firstMissedSlot) {
        obj.push([user.eth1Addr, user.validatorId, 0, user.missedSlots, user.slashFee, user.firstBlockProposed]);
        isSlashed = true;
      } else { 
        let missedSlots = user.missedSlots !== 0 ? user.missedSlots - 1 : user.missedSlots;
        if(missedSlots > 0 || user.slashFee > 0) {
          obj.push([user.eth1Addr, user.validatorId, 0, missedSlots, user.slashFee, user.firstBlockProposed]);
          isSlashed = true;
        }
        if(user.missedSlots > 0) {
          user.firstMissedSlot = true;	
        }
      }
    }

    // Calculate eth to slash
    if( isSlashed ) {
      const rUser = obj[obj.length - 1]; 
      const missedSlashes = MISSED_PROPOSAL_FEE.mul(BigNumber.from(rUser[3]));
      const feeSlashes = SLASH_FEE.mul(BigNumber.from(rUser[4]));

      let stake = validator[4];
      let tFees = missedSlashes.add(feeSlashes); 

      // Make sure user has enough stake
      if( stake.lt(tFees) ) {
        tFees = stake; 
      };

      tSlashes = tSlashes.add(tFees);
    }

    // Update db
    if( collections.users != undefined ) {
      user.slashFee = 0;
      user.missedSlots = 0;
      const query = {eth1Addr: user.eth1Addr, validatorId: user.validatorId};
      await collections.users.updateOne(query, { $set: user});
    }
  }
  return [obj, tSlashes.add(tRewards)];
}

