import { BigNumber } from "ethers";
import { Validator } from "../../src/types";
import { STAKE_FEE } from "../../src/utils";

export const validators: Validator[] = [
  {
    index: 100, 
    eth1: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266".toLowerCase(),
    rewards: BigNumber.from("0"),
    slashMiss: 0,
    slashFee: 0, 
    stake: STAKE_FEE,
    firstBlockProposed: false, 
    firstMissedSlot: false,
    exitRequested: false,
    active: true
  },
  {
    index: 200, 
    eth1: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266".toLowerCase(),
    rewards: BigNumber.from("0"),
    slashMiss: 0,
    slashFee: 0, 
    stake: STAKE_FEE,
    firstBlockProposed: false, 
    firstMissedSlot: false,
    exitRequested: false,
    active: true
  },
  {
    index: 300, 
    eth1: "0xf38Fd6e51aad88F6F4ce6aB8827279cffFb92266".toLowerCase(),
    rewards: BigNumber.from("0"),
    slashMiss: 0,
    slashFee: 0, 
    stake: STAKE_FEE,
    firstBlockProposed: false, 
    firstMissedSlot: false,
    exitRequested: false,
    active: true
  },
  {
    index: 400, 
    eth1: "0xf38Fd6e51aad88F6F4ce6aB8827279cffFb92266".toLowerCase(),
    rewards: BigNumber.from("0"),
    slashMiss: 0,
    slashFee: 0, 
    stake: STAKE_FEE,
    firstBlockProposed: false, 
    firstMissedSlot: false,
    exitRequested: false,
    active: true
  },
  {
    index: 500, 
    eth1: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266".toLowerCase(),
    rewards: BigNumber.from("0"),
    slashMiss: 0,
    slashFee: 0, 
    stake: STAKE_FEE,
    firstBlockProposed: false, 
    firstMissedSlot: false,
    exitRequested: false,
    active: true
  },
];

