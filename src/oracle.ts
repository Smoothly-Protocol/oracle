import { Config } from "./config";
import { DB } from "./db";
import { EMPTY_ROOT } from "./utils";
import { Contract } from "ethers"; 
import { 
  Registered, 
  ExitRequested,
  VoluntaryExits,
  BlockListener
} from "./listeners";

export class Oracle extends Config {
  db: DB;  

  constructor(_network: string, _pk: string) {
    super(_network, _pk);
    let testing = false;
    if(_network === "local") {
     testing = true 
    }
    this.db = new DB(EMPTY_ROOT, testing);
  }

  start(): void {
    Registered(this);
    ExitRequested(this);
    VoluntaryExits(this);
    BlockListener(this);
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
