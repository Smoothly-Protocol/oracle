import { Config } from '../config';

export function startDeactivationListener(config: Config) {
  const contract = config.contract;
	const filter = contract.filters.ValidatorDeactivated();
	contract.on(filter, (validator) => {
		deactivateValidator(validator);	
	});
	console.log("Listening to deactivation events");
}

export async function deactivateValidator(validator: string) {
	// Delete from database
  //const result = await collections.users.deleteOne({pubKey: validator});
  console.log(`Deleted user with pubKey: ${validator}`)
}

