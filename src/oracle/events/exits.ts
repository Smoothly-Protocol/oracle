import { Oracle } from '../oracle';
import { Validator } from "../../types";

export function ExitRequested(oracle: Oracle) {
  const contract = oracle.contract;
	const filter = contract.filters.ExitRequested();
	contract.on(filter, (sender, indexes, epoch) => {
      validateExitRequest(sender, indexes, epoch, oracle);	
	});
	console.log("Listening to Exit Request events");
}

export async function validateExitRequest(
	sender: string, 
	indexes: number[], 
  epoch: number,
	oracle: Oracle 
) {
  sender = sender.toLowerCase();
  for(let index of indexes) {
    const validator: Validator | undefined = await oracle.db.get(index);
    // Validate caller as owner
    if(validator && (validator.eth1 === sender)) {
      validator.exitRequested = true;
      await oracle.db.insert(index, validator); 
    } 
  }
}

