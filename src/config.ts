import { NetInfo, Defaults } from "./types";
import { providers, Contract, Wallet } from "ethers";
import { Trie } from '@ethereumjs/trie'
import { Level } from 'level';
import { LevelDB, ABI } from './utils';

const GOERLI: NetInfo = {
  rpc: "https://eth-goerli.alchemyapi.io/v2/zmsxPR7pKHtiLvAkZ1R61BYtCqnCg0yc",
  contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  beacon: "http://unstable.prater.beacon-api.nimbus.team",
  beaconchainApi: "https://goerli.beaconcha.in"
}

const MAINNET: NetInfo = {
  rpc: "https://eth-mainnet.alchemyapi.io/v2/zmsxPR7pKHtiLvAkZ1R61BYtCqnCg0yc",
  contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  beacon: "http://unstable.mainnet.beacon-api.nimbus.team/",
  beaconchainApi: "https://beaconcha.in"
}

const LOCAL: NetInfo = {
  rpc: "http://127.0.0.1:8545",
  contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  beacon: "http://unstable.prater.beacon-api.nimbus.team/",
  beaconchainApi: "https://goerli.beaconcha.in"
}

const DEFAULTS: Defaults = {
  folder: ".smoothly"
}

export class Config {
  contract: Contract;
  db?: Trie;
  signer: Wallet;
  root?: string;
  network: NetInfo;

  constructor(_network: string, _pk: string ) {
    // Network 
    if(_network === "goerli") {
      this.network = GOERLI;
    } else if(_network === "mainnet") {
      this.network = MAINNET;
    } else if(_network === "local") {
      this.network = LOCAL;
    } else {
      throw new Error("Unknown or not supported network.");
    } 

    // Blockchain
    this.contract = new Contract(
      this.network.contractAddress,
      ABI,
      new providers.JsonRpcProvider(this.network.rpc)
    );

    // Signer
    this.signer = this.validateWallet(_pk);
  }

  async initDB() {
    try {
      const root: string = await this.contract.ROOT();
      this.db = new Trie({
        db: new LevelDB(new Level(`${DEFAULTS.folder}/db`)),
        useKeyHashing: true,
        root: Buffer.from(root.slice(2), 'hex')
      })
      this.root = root;
      return this;
    } catch(err: any) {
      throw new Error("Network configuration error");
    }
  }

  validateWallet(pk: string) {
    try {
      const wallet = new Wallet(pk);
      return wallet;
    } catch {
      throw new Error("Invalid private key");
    }
  }
}
