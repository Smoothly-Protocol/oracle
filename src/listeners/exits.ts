import { Oracle } from '../oracle';
import { Validator } from "../types";

export function ExitRequested(oracle: Oracle) {
  const contract = oracle.contract;
	const filter = contract.filters.ExitRequested();
	contract.on(filter, (sender, indexes) => {
    for(let index of indexes) {
      validateRequest(sender.toLowerCase(), index, oracle);	
    }
	});
	console.log("Listening to Exit Request events");
}

async function validateRequest(
	sender: string, 
	index: number, 
	oracle: Oracle 
) {
  const validator: Validator | undefined = await oracle.db.get(index);
  // Validate caller as owner
  if(validator && (validator.eth1 === sender)) {
    validator.exitRequested = true;
    await oracle.db.insert(index, validator); 
  } 
}

