import { utils, BigNumber } from "ethers";

export const FEE: number = 15; // 1.5% Protocol_fee on rebalance
export const EMPTY_ROOT: string = "56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421";

export let STAKE_FEE: BigNumber;
export let SLASH_FEE: BigNumber;
export let MISS_FEE: BigNumber;

export const initGlobal = (network: string) => {
  if(network === "mainnet") {
    STAKE_FEE = utils.parseEther("0.5");
    SLASH_FEE = utils.parseEther("0.5");
    MISS_FEE = utils.parseEther("0.15");
  } else {
    STAKE_FEE = utils.parseEther("0.05");
    SLASH_FEE = utils.parseEther("0.05");
    MISS_FEE = utils.parseEther("0.015");
  } 
}

