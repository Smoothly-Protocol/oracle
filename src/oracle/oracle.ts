import * as cron from "node-cron";
import { Config } from "../config";
import { DB } from "../db";
import { Contract, utils } from "ethers"; 
import { 
  processEpoch,
  EpochListener
} from "./epoch";
import { MonitorRelays } from "./relays";
import { 
  Registered,
  ExitRequested,
  StakeAdded,
  StakeWithdrawal,
  RewardsWithdrawal,
  Rebalance 
} from './events';
import { Node } from './p2p';
import type { Libp2p } from 'libp2p';

export class Oracle extends Config {
  db: DB;  
  p2p: Node;

  constructor(opts: any, _root: string) {
    super(opts);
    this.db = new DB(_root, opts.network === "local");
    this.p2p = new Node(
      this.network.bootstrapers, 
      this.db, 
      opts.httpApi, 
      opts.privateKey,
      opts.autoNAT
    );
  }

  async start(epoch: number, _root: string, checkpoint?: string): Promise<void> {
    // Init libp2p node
    await this.p2p.createNode();

    // Sync state
    const root = await this.getRoot();
    const hasRoot = await this.db.hasRoot(root);

    // Sync from checkpoint if provided
    if(checkpoint) {
      console.log("Syncing from checkpoint node...");
      await this.sync(checkpoint);
    } else if(hasRoot) {
      console.log("Syncing from last root known:", _root);
      await this.fullSync(epoch);
    } else {
      await this.p2p.requestSync();
    }

    // Network listeners
    EpochListener(this);

    // Routine jobs
    cron.schedule('30 0 * * *', async () => {
      await MonitorRelays(this);
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
      console.log(err);
      throw new Error("Sync failed, make sure checkpoint is active");
    }
  }

  async fullSync(current: number): Promise<any> {
    current === 0 ? current = this.network.deploymentEpoch : 0;
    try {
      await processEpoch(current, true, this);
      return this.fullSync(current + 1);
    } catch(err: any) {
      console.log(err);
      return 0;
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
