import { NetInfo } from "../types";

export const Peers = [
  "16Uiu2HAmPh1zstkuEATAxZVR9hQLfvh6E9RgSuX1AnpJWQXyzfXu",
  "16Uiu2HAkvyHWXj9caLxEPc2JbTWmapXqHpimTP4oqYZvSSoCAJtJ",
  "16Uiu2HAmR7AXaAmkikrGo4W6iYJSNseC1PEdMJ3LEyw4cU57283c",
  "16Uiu2HAmTAKstCuxMozUFcmXoTJHpUrcM3YJxV4uNVntYBPNBZjo",
  "16Uiu2HAmAm1SD5s9tJpFwxj5uTEiSpbYG1QqCqFRH49q3xWFS1H6",
  "16Uiu2HAkvU861aiRsknGdppTv5PVqLjui4RYCGopMCn7corbJ75R"
];

export const GOERLI: NetInfo = {
  rpc: "",
  rpcBu: ["https://eth-goerli.g.alchemy.com/v2/V_A06Ohwm0CcD11zULvNA1-rCY8xnHT8"],
  pool: "0x2bE68B8Fd9E7941378CA81dF120F2F7eBb7c0Cf6",
  governance: "0xCD98b998d6C3e5685dD46bc9F7f056A3E5dd8AF5",
  beacon: "",
  beaconBu: ["http://unstable.prater.beacon-api.nimbus.team"],
  beaconchainApi: "https://goerli.beaconcha.in",
  relays: [
    "https://boost-relay-goerli.flashbots.net",
    "https://relay-stag.ultrasound.money",
    "https://goerli.aestus.live"
  ],
  bootstrapers: [
      //'/ip4/127.0.0.1/tcp/5040/ws/p2p/16Uiu2HAmA252NhbTLbwog6TY8ahyehHPFAdfWiwp2DsaL6uZqGki',
      '/dns4/relay.smoothly.money/tcp/443/wss/p2p/16Uiu2HAmTAKstCuxMozUFcmXoTJHpUrcM3YJxV4uNVntYBPNBZjo'
  ],
  deploymentEpoch: 169060 
}

export const MAINNET: NetInfo = {
  rpc: "",
  rpcBu: ["https://eth-mainnet.alchemyapi.io/v2/zmsxPR7pKHtiLvAkZ1R61BYtCqnCg0yc"],
  pool: "N/A",
  governance: "N/A",
  beacon: "",
  beaconBu: ["http://unstable.mainnet.beacon-api.nimbus.team"],
  beaconchainApi: "https://beaconcha.in",
  relays: [],
  bootstrapers: [],
  deploymentEpoch: 163682
}

export const LOCAL: NetInfo = {
  rpc: "",
  rpcBu: ["http://127.0.0.1:8545"],
  pool: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  governance:"0x5FbDB2315678afecb367f032d93F642f64180aa3",
  beacon: "",
  beaconBu: ["http://unstable.prater.beacon-api.nimbus.team"],
  beaconchainApi: "https://goerli.beaconcha.in",
  relays: [],
  bootstrapers: [],
  deploymentEpoch: 0 
}

