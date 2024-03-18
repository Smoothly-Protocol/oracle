import { NetInfo, Defaults } from "../types";
import { 
  providers, 
  Contract, 
  Wallet, 
  ContractFactory,
  BigNumber,
} from "ethers"; 
import { 
  HOLESKY,
  MAINNET,
  LOCAL
} from './networks';
import { pool, governance } from '../artifacts';
import { reqEpochCheckpoint, reqEpochSlots } from '../oracle/epoch';
import PinataClient from '@pinata/sdk';
import { logger, initGlobal } from '../utils';

export class Config {
  contract: Contract;
  governance: Contract;
  signer: Wallet;
  network: NetInfo;
  pinata?: PinataClient;
  apiPort: number;

  constructor(opts: any) {
    const _network = opts.network;
    const _pk = opts.privateKey;

    // Network
    if(_network === "holesky") {
      this.network = HOLESKY;
    } else if(_network === "mainnet") {
      this.network = MAINNET;
    } else if(_network === "local") {
      this.network = LOCAL;
    } else {
      throw new Error("Unknown or not supported network.");
    } 

    initGlobal(_network);

    this.apiPort = opts.httpApi;
    
    // Setup Pinata
    if(opts.pinataJWT) {
      this._verifyIpfsAuth(opts.pinataJWT);
    }

    // Setup CL
    this._setupCL(opts.beacon);

    // Setup EL 
    this._setupEL(opts.eth1);

    const { _signer, _contract, _governance } = this._initEL(_pk); 
    this.signer = _signer;
    this.contract = _contract;
    this.governance = _governance;
    
    this._isEth1Alive(this.network.rpc, true);
  }

  async getRoot(): Promise<string> {
    try {
      return await this.contract.stateRoot();
    } catch(err: any) {
      throw new Error("Eth1 rpc endpoint not responding");
    }
  }

  async getBalance(blockNumber: string): Promise<BigNumber> {
    return await this.contract.provider.getBalance(
      this.contract.address, 
      blockNumber === "latest" ? blockNumber : Number(blockNumber)
    )
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

  async switchToBackup(logs: boolean = true): Promise<boolean> {
    try {
      await this._isEth1Alive(this.network.rpc, logs);
    } catch {
      const rpc = this.network.rpc;
      this.network.rpc = this.network.rpcBu[0] 
      this.network.rpcBu.shift();
      this.network.rpcBu.push(rpc);
      
      const { _signer, _contract, _governance } = this._initEL(this.signer.privateKey); 
      this.signer = _signer;
      this.contract = _contract;
      this.governance = _governance;

      logger.warn(`Switched to Backup Eth1 rpc - url=${this.network.rpc}`);
    }

    try {
      await this._isBeaconAlive(this.network.beacon, logs);
    } catch {
      const beacon = this.network.beacon;
      this.network.beacon = this.network.beaconBu[0] 
      this.network.beaconBu.shift();
      this.network.beaconBu.push(beacon)
      logger.warn(`Switched to Backup Beacon node - url=${this.network.beacon}`);
      return true;
    }
    return false;
  }

  private _setupCL(nodes: string[]): void {
    if(nodes.length > 0) {
      this.network.beacon = nodes[0];
      this.network.beaconBu = nodes.slice(1).concat(this.network.beaconBu);
    } else {
      this.network.beacon = this.network.beaconBu[0];
    }

    this._isBeaconAlive(this.network.beacon, true);
  }

  private _setupEL(rpcs: string[]): void {
    if(rpcs.length > 0) {
      this.network.rpc = rpcs[0];
      this.network.rpcBu = rpcs.slice(1).concat(this.network.rpcBu);
    } else {
      this.network.rpc = this.network.rpcBu[0];
    }
  }

  private  _initEL(pk: string)
    : {_signer: Wallet, _contract: Contract, _governance: Contract} 
  {
    // Signer
    const _signer: Wallet = this.validateWallet(pk);

    // Smoothly Pool 
    const _contract: Contract = new Contract(
      this.network.pool,
      pool["abi"],
      _signer 
    );

    // Governance 
    const _governance: Contract = new Contract(
      this.network.governance,
      governance["abi"],
      _signer
    );

    return { _signer, _contract, _governance};
  }

  private async _isEth1Alive(rpc: string, logs: boolean): Promise<void> {
    try {
      await this.getRoot();
      if(logs) {
        logger.info(`Eth1 node detected - url=${this.network.rpc}`);
      }
    } catch { 
      throw new Error("Eth1 rpc endpoint not responding");
    }
  }

  private async _isBeaconAlive(beacon: string, logs: boolean): Promise<void> {
    try {
      const epoch = await reqEpochCheckpoint(beacon); 
      const res = await reqEpochSlots(epoch, beacon);
      if(res.code || res.statusCode) {
        throw res.message;
      }
      if(logs) {
        logger.info(`Beacon node detected - url=${beacon}`);
      }
    } catch (err: any){
      throw new Error(`Beacon node is not responding - err=${err}`);
    }
  }

  private async _verifyIpfsAuth(JWT: string): Promise<void> {
    try {
      this.pinata = new PinataClient({ pinataJWTKey: JWT });
      await this.pinata.testAuthentication();
      logger.info("Successfully Authenticated with pinata");
    } catch {
      throw new Error("Invalid Pinata auth JWT Token");
    }
  }
}
