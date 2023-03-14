import { NetInfo, Defaults, User } from "./types";
import { 
  providers, 
  Contract, 
  Wallet, 
  ContractFactory 
} from "ethers"; 
import { Trie } from '@ethereumjs/trie'
import { RLP } from '@ethereumjs/rlp'
import { Level } from 'level';
import { LevelDB, artifact } from './utils';

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

  constructor(_network: string, _pk: string) {
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

    // Signer
    this.signer = this.validateWallet(_pk);

    // Blockchain
    this.contract = new Contract(
      this.network.contractAddress,
      artifact["abi"],
      new providers.JsonRpcProvider(this.network.rpc)
    );
  }

  async initDB(): Promise<Config> {
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

  async insertDB(key: string, user: User): Promise<void> {
    if(this.db !== undefined) {
      const value = await this.getDB(key);
      if(value !== undefined) {
        let arr: User[] = []; 
        arr = value.map((v: User) => {return v});
        arr.push(user);
        await this.db.put(Buffer.from(key), Buffer.from(RLP.encode(arr)));
      } else {
        await this.db.put(Buffer.from(key), Buffer.from(RLP.encode([user])));
      }
    }
  }

  async getDB(key: string): Promise<any> {
    let user;
    if(this.db !== undefined) {
      user = await this.db.get(Buffer.from(key));
    }
    return user != null 
      ? RLP.decode(user) 
      : undefined;
  }

  validateWallet(pk: string): Wallet {
    try {
      const provider = new providers.JsonRpcProvider(this.network.rpc)
      const wallet = new Wallet(pk, provider);
      return wallet;
    } catch {
      throw new Error("Invalid private key");
    }
  }
}
