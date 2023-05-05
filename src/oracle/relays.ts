import { Oracle } from "./oracle";
import { Validator } from "../types";

const headers = {
  method: "GET",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  }
};

export async function MonitorRelays(oracle: Oracle): Promise<void> {
  try {
    const { relays, beacon, pool } = oracle.network;
    const db = oracle.db;

    let validators: Validator[] = [];

    // Get all validators
    const stream = await db.getStream();
    await new Promise((fulfilled) => { 
      stream
      .on('data', async (data: any) => {
        validators.push(JSON.parse(data.value.toString()));
      })
      .on('end', fulfilled);
    });

    console.log("Starting Daily relay Monitoring, this might take a while...");

    for(let validator of validators) {
      let ltsTimestamp: number = 0;
      const pubKey = await getPubKey(beacon, validator.index);

      // Look for wrong fee recipients
      for(let relay of relays) {
        const res = await reqRelayRegistration(relay, pubKey);
        
        if(res.code === 400) {
          console.log(`Validator ${validator.index} not registered in: ${relay}`);
        } else if(res.code === 500) {
          console.log(relay, "down, due to internal error");
        } else if(res.message) {
          const { fee_recipient, timestamp } = res.message; 
          const t = Number(timestamp);
          
          if(ltsTimestamp <= t) {
            if(fee_recipient.toLowerCase() === pool.toLowerCase()) {
              validator.excludeRebalance = false;
            } else { 
              validator.excludeRebalance = true; 
            }
          }

          ltsTimestamp = t;
        }
      }
      
      // Update
      await db.insert(validator.index, validator);
    }
  } catch(err: any) {
    console.log(err);
  }
}

async function getPubKey(beacon: string, index: number): Promise<string> {
  const url = `${beacon}/eth/v1/beacon/states/finalized/validators/${index}`;
  const req = await fetch(url, headers);
  const res = await req.json();
  if(res.code) {
    throw `Failed to get pubkey: ${res.code} - ${res.message}`;
  }
  return res.data.validator.pubkey;
}

async function reqRelayRegistration(relay: string, pubkey: string): Promise<any> {
  try {
    const url = `${relay}/relay/v1/data/validator_registration?pubkey=${pubkey}`;	
    const req = await fetch(url, headers);
    const res = await req.json();
    return res;
  } catch(err: any) {
    console.log(err);
  }
}
