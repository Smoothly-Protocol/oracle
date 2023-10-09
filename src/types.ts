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
  excludeRebalance?: boolean,
  exitRequested: boolean,
  active: boolean,
  deactivated: boolean
}

export interface TrieRebalance {
  includedValidators: Validator[],  
  tRewards: BigNumber,
  tStake: BigNumber
}

export interface Head {
	root: string,
	epoch: number
}

export interface NetInfo {
  rpc: string,
  rpcBu: string[],
  pool: string, 
  governance: string, 
  beacon: string,
  beaconBu: string[],
  beaconchainApi: string,
  relays: string[],
  bootstrapers: string[],
  deploymentEpoch: number
}

export interface Defaults {
  folder: string,
}

export interface ValidatorInfo {
  publickey: string;
  valid_signature?: boolean;
  validatorindex: number;
}

export interface Proofs {
  withdrawals: string[],
  exits: string[]
}
