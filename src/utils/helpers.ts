import fs from "fs";
import * as path from 'path';
import { homedir } from 'os';
import { Oracle } from "../oracle";
import { Validator } from "../types";
import { Contract, utils } from "ethers";
import { Head } from '../types';

export async function filterLogs(
  blockNumber: number,
  contract: Contract
): Promise<any> {
  let filters: any = [];
  filters[0] = contract.filters.Registered();
  filters[1] = contract.filters.RewardsWithdrawal();
  filters[2] = contract.filters.StakeWithdrawal();
  filters[3] = contract.filters.StakeAdded();
  filters[4] = contract.filters.ExitRequested();
  filters[5] = contract.filters.Epoch();
  return contract.queryFilter(filters,Number(blockNumber), Number(blockNumber))
}
 
export function existsHead(): Head | null {  
  try {
    const data: Head = JSON.parse(
      fs.readFileSync(
        path.resolve(homedir(), `.smoothly/head.json`),
        'utf8'
      )
    );
    return data; 
  } catch {
    return null;
  }
}
