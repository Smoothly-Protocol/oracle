import { BigNumber } from "ethers";
import { Oracle } from '../oracle';
import { Validator } from "../../types";

export function StakeAdded(oracle: Oracle) {
  const contract = oracle.contract;
	const filter = contract.filters.StakeAdded();
	contract.on(filter, (sender, index, value) => {
      validateAddedStake(sender, index, value, oracle);	
	});
	console.log("Listening to StakeAdded events");
}

export async function validateAddedStake(
	sender: string, 
  index: number,
	value: number, 
	oracle: Oracle 
) {
  // Make sure to avoid it if sender is deactivated
  sender = sender.toLowerCase();
  const validator: Validator | undefined = await oracle.db.get(index);
  // Validate caller as owner
  if(validator && (validator.eth1 === sender) && !validator.deactivated) {
    validator.stake = BigNumber.from(validator.stake).add(value);
    await oracle.db.insert(index, validator); 
  } 
}

