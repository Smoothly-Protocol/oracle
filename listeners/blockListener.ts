import EventSource from "eventsource";
import * as dotenv from 'dotenv';
import { collections } from "../db/src/database.service";
import { Contract } from "ethers";

export async function startBlockListener(contract: Contract) {
  const eth2 = new EventSource(`${process.env.PRATER_NODE}/eth/v1/events?topics=block`);
  let lastSlot = 0;
  let epoch = 159563;
  eth2.addEventListener('block', async (e)  => {
    const { slot } = JSON.parse(e.data);	
    // Check for missed slots
    if(lastSlot === 0) {
      lastSlot = slot;
    } else {
      let missed = Number(slot) - (Number(lastSlot) + 1);
      if(missed > 0) {
        addMissedSlots(lastSlot, missed, epoch);
      }
      lastSlot = slot;
    }	

    // Add Slot
    const res = await waitForBlockInfo(slot);
    isUserSlot(res, contract);

    // Update Epoch
    const attestations = res.data.message.body.attestations;
    if(attestations.length > 0) {
      epoch = attestations[0].data.target.epoch;
    }
  });
  console.log("Listening to new proposed blocks");
}

async function addMissedSlots(last: number, missed: number, epoch: number) {
  if(missed !== 0) {
    let found = false;
    last = Number(last) + 1;
    while(!found && epoch !== 0) {
      const res = await reqEpochSlots(epoch);
      // Find correct epoch
      if(last > res.data[31].slot) {
        epoch = Number(epoch) + 1;
        continue;
      } else if(last < res.data[0].slot) {
        epoch = Number(epoch) - 1;
        continue;
      }
      // Check if is User
      for(let i = 0; i < res.data.length; i++) {
        if(res.data[i].slot === String(last)) {
          if(collections.users != undefined) {
            const query = {validatorIndex: Number(res.data[i].validator_index)};
            const user = await collections.users.findOne(query);
            if(user) {
              user.missedSlots += 1;
              await collections.users.updateOne(query, { $set: user});
              console.log(`User with index ${user.validatorIndex} missed a proposal`);
            }
          }
          found = true;
        }
      }
    }
    addMissedSlots(last, missed - 1, epoch);
  }
  return;
}

async function isUserSlot(res: any, contract: Contract) {
  const { slot, proposer_index, body } = res.data.message;
  if(collections.users != undefined) {
    const query = {validatorIndex: Number(proposer_index)};
    const user = await collections.users.findOne(query);
    if(user) {
      const { fee_recipient, block_hash } = body.execution_payload;
      const block: any = await contract.provider.getBlockWithTransactions(block_hash);
      // Check builder not swapping address
      if( (fee_recipient !== contract.address.toLowerCase()) && 
         (block.transactions[block.transactions.length - 1].to.toLowerCase() !== contract.address.toLowerCase())) 
        {
          user.slashFee += 1;
          console.log("Fee recipient slash for", proposer_index);
        } else { 
          // Activation
          user.firstBlockProposed ? 0 : user.firstBlockProposed = true; 
        }

        await collections.users.updateOne(query, { $set: user});
    }
  }
}

async function waitForBlockInfo(slot: number): Promise<any> {
  let res = await reqBlockInfo(slot);
  while(res.code === 404) {
    res = await reqBlockInfo(slot);
  }
  return res;
}

async function reqBlockInfo(slot: number): Promise<any> {
  const url = `${process.env.PRATER_NODE}/eth/v2/beacon/blocks/${slot}`;	
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

async function reqEpochSlots(epoch: number): Promise<any> {
  const url = `${process.env.PRATER_NODE}/eth/v1/validator/duties/proposer/${epoch}`;	
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
