import EventSource from "eventsource";
import * as dotenv from 'dotenv';
import { collections } from "../db/src/database.service";
import { Contract } from "ethers";

export async function startBlockListener(contract: Contract) {
  const eth2 = new EventSource(`${process.env.PRATER_NODE}/eth/v1/events?topics=finalized_checkpoint`);
  eth2.addEventListener('finalized_checkpoint', async (e)  => {
    const { epoch } = JSON.parse(e.data);	
    const { data } = await reqEpochSlots(epoch);

    console.log("Processing epoch:", Number(epoch));

    for(let i = 0; i < data.length; i++) {
      const { slot, validator_index } = data[i];
      const user = await isUser(contract, Number(validator_index));
      if(user) {
        const res = await reqSlotInfo(slot);
        res !== undefined ? 
          await validateSlot(user, res.body, contract) : 
          await addMissedSlot(user); 
      }
    }
  });
  console.log("Listening for new finalized_checkpoints");
}

async function addMissedSlot(user: any) {
  if(collections.users != undefined) {
    user.missedSlots += 1;
    await collections.users.updateOne({validatorIndex: user.validatorIndex}, { $set: user});
    console.log(`Missed proposal: validator with index ${user.validatorIndex}`);
  }
}

async function validateSlot(user: any, body: any, contract: Contract) {
  if(collections.users != undefined) {
    const { fee_recipient, block_hash } = body.execution_payload;
    const block: any = await contract.provider.getBlockWithTransactions(block_hash);
    // Check builder not swapping address
    if( (fee_recipient.toLowerCase() != contract.address.toLowerCase()) && 
       (block.transactions[block.transactions.length - 1].to.toLowerCase() != contract.address.toLowerCase())) 
      {
        user.slashFee += 1;
        console.log(`Proposed block with incorrect fee recipient: validator with index ${user.validatorIndex}`);
      } else { 
        // Activation
        if(!user.firstBlockProposed) {
          user.firstBlockProposed = true
          console.log(`Activated: validator with index ${user.validatorIndex}`);
        } 
        console.log(`Proposed block: validator with index ${user.validatorIndex}`);
      }

      await collections.users.updateOne({validatorIndex: user.validatorIndex}, { $set: user});
  }
}

async function isUser(contract: Contract, validator_index: number) : Promise<any> {
  if(collections.users != undefined) {
    const query = {validatorIndex: validator_index};
    const user = await collections.users.findOne(query);
    return user ? user : undefined;
  }
  return undefined;
}

async function reqSlotInfo(slot: number): Promise<any> {
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
  return res.code === 404 ? undefined : res.data.message;
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

