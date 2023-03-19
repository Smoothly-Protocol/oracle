import { Oracle } from '../oracle';
import { Validator } from "../types";

export function ExitRequested(oracle: Oracle) {
  const contract = oracle.contract;
	const filter = contract.filters.ExitRequested();
	contract.on(filter, (sender, indexes) => {
    for(let index of indexes) {
      validateRequest(sender, index, oracle);	
    }
	});
	console.log("Listening to Exit Request events");
}

async function validateRequest(
	sender: string, 
	index: number, 
	oracle: Oracle 
) {
  let user: Validator | undefined = await oracle.db.get(sender, index);
  if(user) {
    user.exitRequested = true;
    await oracle.db.insert(sender, index, user); 
  } 
}

