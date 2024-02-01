import { Oracle } from "./oracle";
import { Validator } from "../types";
import { logger } from "../utils";

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

    logger.info("Starting Daily relay Monitoring, this might take a while...");

    for(let validator of validators) {
      if(validator.excludeRebalance) continue;
      let ltsTimestamp: number = 0;
      const pubKey = await getPubKey(beacon, validator.index);

      // Look for wrong fee recipients
      let nonRegistered = 0;
      for(let relay of relays) {
        const res = await reqRelayRegistration(relay, pubKey);
        
        if(res.code === 400) {
          nonRegistered ++;
        } else if(res.code === 500) {
          logger.error(`Relay down - relay=${relay} - status=${500}`);
        } else if(res.message) {
          const { fee_recipient, timestamp } = res.message; 
          const t = Number(timestamp);
          
          if(ltsTimestamp <= t) {
            if(fee_recipient.toLowerCase() === pool.toLowerCase()) {
              validator.excludeRebalance = false;
            } else { 
              validator.excludeRebalance = true; 
            }
            ltsTimestamp = t;
          }

        }
      }
      
      if(nonRegistered === relays.length) {
          validator.excludeRebalance = true; 
          logger.info(`Validator not registered in any relays - validator_index=${validator.index} `);
      } else if(validator.excludeRebalance) {
          logger.info(`Validator found with different fee_recipient - validator_index=${validator.index} `);
      }

      // Update
      await db.insert(validator.index, validator);
    }
  } catch(err: any) {
    logger.error(err);
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
    logger.error(`Fetch failed to request validator registration: relay=${relay} - pubkey=${pubkey}`);
    return { code: 408 }
  }
}

