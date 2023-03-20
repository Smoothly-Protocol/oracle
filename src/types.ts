export interface Validator {
  index: number, 
  rewards: number, 
  slashMiss: number, 
  slashFee: number 
  stake: number, 
  firstBlockProposed: boolean, 
  firstMissedSlot: boolean,  
  exitRequested: boolean,
  active: boolean
}

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
