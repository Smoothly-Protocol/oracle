import { Oracle } from "./oracle";

const headers = {
  method: "GET",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  }
};

export async function MonitorRelays(oracle: Oracle) {
  try {
    const { relays, beacon } = oracle.network;
    const pubKey = await getPubKey(beacon, 368721);

    for(let relay of relays) {
      const url = `${relay}/relay/v1/data/validator_registration?pubkey=${pubKey}`;	
      const req = await fetch(url, headers);
      const res = await req.json();
      if(res.code === 400) {
        console.log("Validator not register in:", relay);
      } else if(res.code === 500) {
        console.log(relay, "down, due to internal error");
      }
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
