import { Oracle } from '../oracle';
import { Validator } from "../../types";
import { processRebalance, fundUsers } from "../rebalancer";
import { MonitorRelays } from "../relays";

export async function simulateRebalance(
	root: string, 
  block: number,
	oracle: Oracle 
) {
  const poolAddr = oracle.network.pool;
  const balance = await oracle.contract.provider.getBalance(poolAddr, block - 1); 

  const { 
    includedValidators, 
    tRewards, 
    tStake 
  } = await processRebalance(oracle.db);

  const total = balance.sub(tRewards.add(tStake));
  const fee = await fundUsers(includedValidators, total, oracle.db);
  console.log("event root:", root);
  console.log("processed root:", await oracle.db.root());
}

