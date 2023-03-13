// Need to match contract struct Validator
export type User = [
  number, // validatorIndex 
  number, // rewards
  number, // slash_miss
  number, // slash_fee
  number, // stake
  boolean, // active -> firstBlockProposed
  boolean // firstMissedSlot 
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
