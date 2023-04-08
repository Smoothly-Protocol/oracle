import * as cron from "node-cron";
import { Config } from "../config";
import { DB } from "../db";
import { EMPTY_ROOT } from "../utils";
import { Contract, utils } from "ethers"; 
import { 
  processEpoch,
  reqEpochCheckpoint,
  EpochListener
} from "./epoch";
import { Rebalancer } from "./rebalancer";
import { 
  Registered,
  ExitRequested,
  StakeAdded,
  StakeWithdrawal,
  RewardsWithdrawal
} from './events';

export class Oracle extends Config {
  db: DB;  
  synced: boolean;

  constructor(_network: string, _pk: string) {
    super(_network, _pk);
    this.db = new DB(EMPTY_ROOT, _network === "local");
    this.synced = false;
  }

  start(): void {
    EpochListener(this);
    Registered(this);
    ExitRequested(this);
    StakeAdded(this);
    StakeWithdrawal(this);
    RewardsWithdrawal(this);
    cron.schedule('* * * * *', async () => {
      Rebalancer(this); 
    });
  }

  async sync(): Promise<void> {
    try { 
      const tmpDB = new DB(EMPTY_ROOT, true);
      const root = await this.getRoot();  
      const checkpoint = await reqEpochCheckpoint(this.network.beacon);  
      // Sync from contract deployment epoch
      const computedRoot = await this.fullSync(
        this.network.deploymentEpoch, 
        checkpoint,
        tmpDB
      );
      console.log(root);
      console.log(computedRoot.toString('hex'));
    } catch (err: any) {
      console.log(err);
    }
  }

  // Rethink this to make it faster
  // I'm thinking download all slots first concurrently and then process
  // all of them
  async fullSync(current: number, to: number, db: DB): Promise<Buffer> {
    while(current <= to) {
      await processEpoch(current, true, this);
      await this.fullSync(current+1, to, db);
    }
    return db.root();
  }

  stop(): void {
    this.contract.provider.removeAllListeners();
  }

  // Used for testing
  updateContract(contract: Contract): Oracle {
    this.contract = contract; 
    return this;
  }
}
