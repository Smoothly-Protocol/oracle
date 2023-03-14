// Need to match contract struct Validator
// boolean: any non-zero byte except "0x80" is considered true used to RLP
// decode in contract. 
export type User = [
  number, // validatorIndex 
  number, // rewards
  number, // slash_miss
  number, // slash_fee
  number, // stake
  number, // boolean -> firstBlockProposed
  number //  boolean -> firstMissedSlot 
]

export interface NetInfo {
  rpc: string,
  contractAddress: string, 
  beacon: string,
  beaconchainApi: string
}

export interface Defaults {
  folder: string,
}

export interface ValidatorInfo {
	publickey: string;
	valid_signature: boolean;
	validatorindex: number;	
}
