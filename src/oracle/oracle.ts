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
import { MonitorRelays } from "./relays";
import { 
  Registered,
  ExitRequested,
  StakeAdded,
  StakeWithdrawal,
  RewardsWithdrawal
} from './events';

export class Oracle extends Config {
  db: DB;  

  constructor(_network: string, _pk: string, _root: string) {
    super(_network, _pk);
    this.db = new DB(_root, _network === "local");
  }

  start(): void {
    EpochListener(this);
    Registered(this);
    ExitRequested(this);
    StakeAdded(this);
    StakeWithdrawal(this);
    RewardsWithdrawal(this);
    cron.schedule('0 17 * * *', async () => {
      await MonitorRelays(this);
      this.rebalance()
    }, {timezone: "America/Los_Angeles"});
  }

  async sync(checkpoint: string): Promise<void> {
    try { 
      const req = await fetch(`${checkpoint}/checkpoint`);
      const res = await req.json();
      for(let validator of res.data) {
        await this.db.insert(validator.index, validator);
      }
    } catch (err: any) {
      throw new Error("Sync failed, make sure checkpoint is active");
    }
  }

  async fullSync(current: number): Promise<any> {
    current === 0 ? current = this.network.deploymentEpoch : 0;
    try {
      await processEpoch(current, true, this);
      return this.fullSync(current + 1);
    } catch(err: any) {
      return 0;
    }
  }

  async rebalance(): Promise<void> {
    const lastEpoch = await this.governance.lastEpoch();
    const epochInterval = await this.governance.epochInterval();
    const timeLock = Number(lastEpoch) + Number(epochInterval);
    const now = Math.floor(Date.now() / 1000);

    // Schedule rebalance
    if(timeLock < now) {
      Rebalancer(this); 
    } else {
      const postponedTime = (timeLock - now) * 1000;
      setTimeout(async () => {Rebalancer(this)}, postponedTime);
      console.log("Next rebalance processing at:", timeLock, "UTC");
    }
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
