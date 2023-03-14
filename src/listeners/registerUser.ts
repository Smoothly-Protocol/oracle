import { providers, Contract, utils, BigNumber } from "ethers";
import { ValidatorInfo, User } from "../types";
import { Config } from '../config';
import { STAKE_FEE } from "../utils";

export function startRegistrationListener(config: Config): void {
  const contract = config.contract;
	const filter = contract.filters.ValidatorRegistered();
	contract.on(filter, (sender, validatorId) => {
		verifyValidator(sender, validatorId, config);
		//verifyValidatorTestnet(contract, sender, validator, id);
	});
	console.log("Listening to register events");
}

async function verifyValidator(
  eth1Addr: string, 
  id: number,
  config: Config 
) {
	const url = `${config.network.beaconchainApi}/api/v1/validator/eth1/${eth1Addr}`;
	const headers = {
		method: "GET",
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json"
		}
	}
	const req = await fetch(url, headers);
	const res = await req.json();
	if(res.status === "OK") {
		let data: Array<ValidatorInfo> = [];
		data = res.data.length != undefined ? res.data : data.push(res.data);
		const { verified, index } = proofOwnership(eth1Addr, id, data);
		if(verified) {
      // Check User Tuple on types used for RLP encoding to Trie.
			const newUser: User = [index, 0, 0, 0, STAKE_FEE, 0, 0];
      await config.insertDB(eth1Addr, newUser);
      console.log(`Successfully created user: with validator ${index} for ${eth1Addr}`)
		} else {
      console.log(`Onowned User: with validator ${index} for ${eth1Addr}`);
		}
	} else {
		console.log("ERR: something went wrong on verifyValidator req call.");
		console.log(" User:", eth1Addr);
		console.log(" Response:", res);
	}
}

function proofOwnership(
	eth1Addr: string, 
	id: number, 
	data: Array<ValidatorInfo>
): {verified: boolean, index: number} {
	const len = data.length;
	let verified: boolean = false;
	let index: number = 0;
	if(len > 0) {
		for(let i = 0; i < len; i++) {
			if(data[i].validatorindex == id) {
				verified = true;
				index = Number(data[i].validatorindex);
			   	return { verified, index }; 
			}
		}
	}	
	return { verified, index };
}

/*
async function verifyValidatorTestnet(_contract: Contract, eth1Addr: string, pubKey: string, id: number) {
	const abi = [
		`event DepositEvent(
			bytes pubkey,
			bytes withdrawal_credentials,
			bytes amount,
			bytes signature,
			bytes index
    	)`	
	];
	const contract = new Contract("0x8c594691c0e592ffa21f153a16ae41db5befcaaa", abi, _contract.provider);
	const logs = contract.filters.DepositEvent();
	const filter: Array<any> = await contract.queryFilter(logs);
	for(let i = 0; i < filter.length; i++) {
		const index: number = formatIndex(filter[i].args[4])
		if(filter[i].args[0] == pubKey) {
			const tx = await _contract.provider.getTransaction(filter[i].transactionHash);
		    if(tx.from == eth1Addr) {
				const newUser: User = {
					eth1Addr: eth1Addr,
					validatorId: id,
					pubKey: pubKey,
					validatorIndex: index,
					missedSlots: 0,
					slashFee: 0,
					firstBlockProposed: false,
					firstMissedSlot: false
				}
				// Push to database
				if (collections.users != undefined) {
					// TODO: check if user already exisst
					const result = await collections.users.insertOne(newUser);
					result 
						? console.log(`Successfully created new user with id ${result.insertedId}`)
						: console.log(`Failed to create a new user for: ${eth1Addr} and ${pubKey}`);
				}
			} else {
				console.log("Invalid validator");
			}	
		}
	}
}

function formatIndex(value: Uint8Array): number {
	const v = utils.arrayify(value);
	const n: Array<number> = [];
	for(let x = 0; x < v.length; x++) {
		if(v[x] !== 0) {
			n.push(v[x]);	
		}
	}	
	return Number(utils.hexValue(n));
}
*/
