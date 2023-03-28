import { NetInfo, Defaults } from "../types";
import { utils, BigNumber } from "ethers";

export const FEE: number = 25; // 2.5% Protocol_fee on rebalance
export const STAKE_FEE: BigNumber = utils.parseEther("0.65");
export const SLASH_FEE: BigNumber = utils.parseEther("0.5");
export const MISS_FEE: BigNumber = utils.parseEther("0.15");

export const EMPTY_ROOT: string = "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421";

export const GOERLI: NetInfo = {
  rpc: "https://eth-goerli.alchemyapi.io/v2/zmsxPR7pKHtiLvAkZ1R61BYtCqnCg0yc",
  contractAddress: "0x56EE0A17812D7CF5f2Db4ce892e4f2a211575132",
  beacon: "http://unstable.prater.beacon-api.nimbus.team",
  beaconchainApi: "https://goerli.beaconcha.in",
  deploymentEpoch: 164323 
}

export const MAINNET: NetInfo = {
  rpc: "https://eth-mainnet.alchemyapi.io/v2/zmsxPR7pKHtiLvAkZ1R61BYtCqnCg0yc",
  contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  beacon: "http://unstable.mainnet.beacon-api.nimbus.team/",
  beaconchainApi: "https://beaconcha.in",
  deploymentEpoch: 163682
}

export const LOCAL: NetInfo = {
  rpc: "http://127.0.0.1:8545",
  contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  beacon: "http://unstable.prater.beacon-api.nimbus.team/",
  beaconchainApi: "https://goerli.beaconcha.in",
  deploymentEpoch: 0 
}

export const DEFAULTS: Defaults = {
  folder: ".smoothly"
}
