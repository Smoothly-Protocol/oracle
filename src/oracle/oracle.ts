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
    cron.schedule('0 17 * * *', async () => {
      this.rebalance()
    }, {timezone: "America/Los_Angeles"});
  }

  async sync(checkpoint: string): Promise<void> {
    try { 
      const req = await fetch(`${checkpoint}/checkpoint`);
      const res = await req.json();
      for(let validator of res.data) {
        this.db.insert(validator.index, validator);
      }
    } catch (err: any) {
      throw new Error("Sync failed, make sure checkpoint is active");
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

  async rebalance(): Promise<void> {
    Rebalancer(this); 
  }

  stop(): void {
    this.contract.provider.removeAllListeners();
  }

  // Used for testing
  updateContract(contract: Contract, governance: Contract): Oracle {
    this.contract = contract; 
    this.governance = governance; 
    return this;
  }
}
