import { BigNumber, utils } from "ethers";
import { Oracle } from '../oracle';
import { Validator } from "../../types";

export function StakeWithdrawal(oracle: Oracle) {
  const contract = oracle.contract;
	const filter = contract.filters.StakeWithdrawal();
	contract.on(filter, (sender, indexes, value) => {
    validateWithdrawalStake(sender, indexes, value, oracle);	
	});
  console.log("Listening to StakeWithdrawal events");
}

export function RewardsWithdrawal(oracle: Oracle) {
  const contract = oracle.contract;
	const filter = contract.filters.RewardsWithdrawal();
	contract.on(filter, (sender, indexes, value) => {
    validateWithdrawalRewards(sender, indexes, value, oracle);	
	});
  console.log("Listening to RewardsWithdrawal events");
}

export async function validateWithdrawalRewards(
	sender: string, 
  indexes: number[],
	value: number, 
	oracle: Oracle 
) {
  sender = sender.toLowerCase();
  for(let index of indexes) {
    const validator: Validator | undefined = await oracle.db.get(index);
    // Validate caller as owner
    if(validator && (validator.eth1 === sender)) {
      validator.rewards = BigNumber.from("0");
      await oracle.db.insert(index, validator); 
    } 
  }
  console.log(`${sender} withdrawal for ${utils.formatEther(value)}`);
}

export async function validateWithdrawalStake(
	sender: string, 
  indexes: number[],
	value: number, 
	oracle: Oracle 
) {
  sender = sender.toLowerCase();
  for(let index of indexes) {
    const validator: Validator | undefined = await oracle.db.get(index);
    // Validate caller as owner
    if(validator && (validator.eth1 === sender)) {
      validator.stake = BigNumber.from("0");
      validator.exitRequested = true;
      if(!validator.firstBlockProposed) {
        validator.rewards = BigNumber.from("0");
      }
      await oracle.db.insert(index, validator); 
    } 
  }
  console.log(`${sender} exited validators: ${indexes}`);
}

