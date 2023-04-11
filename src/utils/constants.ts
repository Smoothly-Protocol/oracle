import { utils, BigNumber } from "ethers";

export const FEE: number = 15; // 0.15% Protocol_fee on rebalance
export const STAKE_FEE: BigNumber = utils.parseEther("0.065");
export const SLASH_FEE: BigNumber = utils.parseEther("0.065");
export const MISS_FEE: BigNumber = utils.parseEther("0.015");

export const EMPTY_ROOT: string = "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421";

