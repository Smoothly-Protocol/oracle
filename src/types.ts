import { BigNumber } from "ethers"; 

export interface Validator {
  index: number, 
  eth1: string,
  rewards: BigNumber, 
  slashMiss: number, 
  slashFee: number 
  stake: BigNumber, 
  firstBlockProposed: boolean, 
  firstMissedSlot: boolean,  
  exitRequested: boolean,
  active: boolean
}

export interface TrieRebalance {
  includedValidators: Validator[],  
  tRewards: BigNumber,
  tStake: BigNumber
}

export interface NetInfo {
  rpc: string,
  contractAddress: string, 
  beacon: string,
  beaconchainApi: string,
  deploymentEpoch: number
}

export interface Defaults {
  folder: string,
}

export interface ValidatorInfo {
	publickey: string;
	valid_signature: boolean;
	validatorindex: number;	
}
