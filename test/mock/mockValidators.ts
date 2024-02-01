import { BigNumber, utils } from "ethers";
import { Validator } from "../../src/types";

const STAKE_FEE = utils.parseEther("0.065");
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
    active: true,
    deactivated: false 
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
    active: true,
    deactivated: false 
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
    active: true,
    deactivated: false 
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
    active: true,
    deactivated: false 
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
    active: true,
    deactivated: false 
  },
];

