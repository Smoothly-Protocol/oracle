import { ContractFactory } from "ethers";

//const pk = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export async function reqEpochCheckpoint(beacon: string): Promise<any> {
  const url = `${beacon}/eth/v1/beacon/states/head/finality_checkpoints`;	
  const headers = {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    }
  };
  const req = await fetch(url, headers);
  const res = await req.json();
  const epoch = res.data.finalized.epoch;
  return epoch;
}



