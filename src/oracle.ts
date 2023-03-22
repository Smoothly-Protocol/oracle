import { Config } from "./config";
import { DB } from "./db";
import { EMPTY_ROOT } from "./utils";
import { Contract, utils } from "ethers"; 
import { 
  Registered, 
  ExitRequested,
  VoluntaryExits,
  BlockListener,
  processEpoch,
  reqEpochCheckpoint
} from "./listeners";

export class Oracle extends Config {
  db: DB;  
  synced: boolean;

  constructor(_network: string, _pk: string) {
    super(_network, _pk);
    this.db = new DB(EMPTY_ROOT, _network === "local");
    this.synced = false;
  }

  start(): void {
    if(this.synced) {
      Registered(this);
      ExitRequested(this);
      VoluntaryExits(this);
      BlockListener(this);
    } else {
      this.sync();
    }
  }

  async sync(): Promise<void> {
    try { 
      const tmpDB = new DB(EMPTY_ROOT, true);
      const root = await this.contract.stateRoot();  
      const checkpoint = await reqEpochCheckpoint(this.network.beacon);  
      // Sync from contract deployment epoch
      await this.checkpointSync(
        this.network.deploymentEpoch, 
        checkpoint,
        tmpDB
      );
    } catch (err: any) {
      console.log(err);
    }
  }

  async checkpointSync(current: number, to: number, db: DB): Promise<Buffer> {
    if(current < to) {
      await processEpoch(current, this.network.beacon, db, this.contract, true);
      await this.checkpointSync(current++, to, db);
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
