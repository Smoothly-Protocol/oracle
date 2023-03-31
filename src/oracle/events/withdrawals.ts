import { BigNumber } from "ethers";
import { Oracle } from '../oracle';
import { Validator } from "../../types";

export function WithdrawalRequested(oracle: Oracle) {
  const contract = oracle.contract;
	const filter = contract.filters.RewardsWithdrawal();
	contract.on(filter, (sender, indexes, value) => {
    validateWithdrawalRewards(sender, indexes, value, oracle);	
	});
	console.log("Listening to Exit Request events");
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
}

export async function validateWithdrawalStake(
	sender: string, 
  indexes: number[],
	value: number, 
	oracle: Oracle 
) {
}

