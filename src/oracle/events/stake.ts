import { BigNumber } from "ethers";
import { Oracle } from '../oracle';
import { Validator } from "../../types";

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

