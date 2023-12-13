import { NetInfo } from "../types";

export const Peers = [
  //"16Uiu2HAmPh1zstkuEATAxZVR9hQLfvh6E9RgSuX1AnpJWQXyzfXu",
  "16Uiu2HAkvyHWXj9caLxEPc2JbTWmapXqHpimTP4oqYZvSSoCAJtJ",
  //"16Uiu2HAmR7AXaAmkikrGo4W6iYJSNseC1PEdMJ3LEyw4cU57283c",
  "16Uiu2HAmTAKstCuxMozUFcmXoTJHpUrcM3YJxV4uNVntYBPNBZjo",
  "16Uiu2HAmAm1SD5s9tJpFwxj5uTEiSpbYG1QqCqFRH49q3xWFS1H6",
  "16Uiu2HAkvU861aiRsknGdppTv5PVqLjui4RYCGopMCn7corbJ75R",
  "16Uiu2HAm5CLA84BsFNqm16qp3wZv4HnKB9fUbFs8oGJ6jY8VuoeZ",
  "16Uiu2HAmgJUBDTuUNBEJUuNwssNEwm7qDLUvC4EGDgkqggG5u16rw",
  "16Uiu2HAkvuZLHhhNgMpb81NuXkZVrwkBtDAhqJAoLKeuB929PAio",
  "16Uiu2HAmKEDorBqPC7Q8jXyyrPfAVNiBDVEh39YTWVjdDDnbpie1"
];

export const GOERLI: NetInfo = {
  rpc: "",
  rpcBu: ["http://rpc.smoothly.money:8545"],
  pool: "0x894F0786cb41b1c1760E70d61cB2952749Da6382",
  governance: "0xc27B0c392e97C07f97e6893ea50FA9cBa82DF7FC",
  beacon: "",
  beaconBu: ["http://beacon.smoothly.money:3500"],
  beaconchainApi: "https://goerli.beaconcha.in",
  relays: [
    "https://boost-relay-goerli.flashbots.net",
    "https://relay-stag.ultrasound.money",
    "https://goerli.aestus.live",
    "https://goerli-relay.securerpc.com",
    "https://goerli-relay.wenmerge.com",
    "https://goerli-blockspace.frontier.tech"
  ],
  bootstrapers: [
      '/ip4/127.0.0.1/tcp/5040/ws/p2p/16Uiu2HAmA252NhbTLbwog6TY8ahyehHPFAdfWiwp2DsaL6uZqGki',
      //'/dns4/relay.smoothly.money/tcp/443/wss/p2p/16Uiu2HAmTAKstCuxMozUFcmXoTJHpUrcM3YJxV4uNVntYBPNBZjo'
  ],
  deploymentEpoch: 209077 
}

export const MAINNET: NetInfo = {
  rpc: "",
  rpcBu: ["https://eth-mainnet.alchemyapi.io/v2/zmsxPR7pKHtiLvAkZ1R61BYtCqnCg0yc"],
  pool: "0x43670D6f39Bca19EE26462f62339e90A39B01e34",
  governance: "0xA20672D73fD75b9e80F52492CE77cBFcF804d679",
  beacon: "",
  beaconBu: ["http://unstable.mainnet.beacon-api.nimbus.team"],
  beaconchainApi: "https://beaconcha.in",
  relays: [
    'https://boost-relay.flashbots.net',
    'https://relay.ultrasound.money',
    'https://aestus.live',
    'https://agnostic-relay.net',
    'https://mainnet-relay.securerpc.com',
    'https://bloxroute.max-profit.blxrbdn.com'
  ],
  bootstrapers: [
    '/ip4/127.0.0.1/tcp/5040/ws/p2p/16Uiu2HAmA252NhbTLbwog6TY8ahyehHPFAdfWiwp2DsaL6uZqGki',
  ],
  deploymentEpoch: 249058
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

