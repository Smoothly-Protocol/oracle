import { providers, Contract, utils, BigNumber } from "ethers";
import * as dotenv from 'dotenv';
import { collections } from "../db/src/database.service";
import User from "../db/models/user";

export function startDeactivationListener(contract: Contract) {
	const filter = contract.filters.ValidatorDeactivated();
	contract.on(filter, (validator) => {
		deactivateValidator(validator);	
	});
	console.log("Listening to deactivation events");
}

async function deactivateValidator(validator: string) {
	// Delete from database
	if (collections.users != undefined) {
		const result = await collections.users.deleteOne({pubKey: validator});
		console.log(`Deleted user with pubKey: ${validator}`)
	}
}

