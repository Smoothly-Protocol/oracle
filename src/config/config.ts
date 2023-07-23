import { NetInfo, Defaults } from "../types";
import { 
  providers, 
  Contract, 
  Wallet, 
  ContractFactory,
  BigNumber 
} from "ethers"; 
import { 
  GOERLI,
  MAINNET,
  LOCAL
} from './networks';
import { pool, governance } from '../artifacts';
import { reqEpochCheckpoint } from '../oracle/epoch';

export class Config {
  contract: Contract;
  governance: Contract;
  signer: Wallet;
  network: NetInfo;

  constructor(opts: any) {
    const _network = opts.network;
    const _pk = opts.privateKey;

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

    opts.beacon ? this.network.beacon = opts.beacon : 0;
    opts.eth1 ? this.network.rpc = opts.eth1 : 0;
    
    this._isBeaconAlive(this.network.beacon);

    // Signer
    this.signer = this.validateWallet(_pk);

    // Smoothly Pool 
    this.contract = new Contract(
      this.network.pool,
      pool["abi"],
      this.signer
    );

    // Eth1 Connectivity check
    this.getRoot();
    
    // Governance 
    this.governance = new Contract(
      this.network.governance,
      governance["abi"],
      this.signer
    );
  }

  async getRoot(): Promise<string> {
    try {
      return await this.contract.stateRoot();
    } catch(err: any) {
      throw new Error("Eth1 endpoint not responding");
    }
  }

  async getBalance(): Promise<BigNumber> {
    return await this.contract.provider.getBalance(this.contract.address)
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

  private async _isBeaconAlive(beacon: string): Promise<void> {
    try {
      await reqEpochCheckpoint(beacon); 
    } catch {
      throw new Error("Beacon node is not responding");
    }
  }
}
