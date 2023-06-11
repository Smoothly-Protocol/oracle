import { NetInfo } from "../types";

export const GOERLI: NetInfo = {
  rpc: "https://eth-goerli.alchemyapi.io/v2/zmsxPR7pKHtiLvAkZ1R61BYtCqnCg0yc",
  pool: "0x2bE68B8Fd9E7941378CA81dF120F2F7eBb7c0Cf6",
  governance: "0xCD98b998d6C3e5685dD46bc9F7f056A3E5dd8AF5",
  beacon: "http://146.190.128.93",
  beaconchainApi: "https://goerli.beaconcha.in",
  relays: [
    "https://boost-relay-goerli.flashbots.net",
    "https://relay-stag.ultrasound.money",
    "https://goerli.aestus.live"
  ],
  deploymentEpoch: 169060 
}

export const MAINNET: NetInfo = {
  rpc: "https://eth-mainnet.alchemyapi.io/v2/zmsxPR7pKHtiLvAkZ1R61BYtCqnCg0yc",
  pool: "N/A",
  governance: "N/A",
  beacon: "http://unstable.mainnet.beacon-api.nimbus.team/",
  beaconchainApi: "https://beaconcha.in",
  relays: [],
  deploymentEpoch: 163682
}

export const LOCAL: NetInfo = {
  rpc: "http://127.0.0.1:8545",
  pool: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  governance:"0x5FbDB2315678afecb367f032d93F642f64180aa3",
  beacon: "http://unstable.prater.beacon-api.nimbus.team/",
  beaconchainApi: "https://goerli.beaconcha.in",
  relays: [],
  deploymentEpoch: 0 
}

