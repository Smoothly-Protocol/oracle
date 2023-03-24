import { Oracle } from "../oracle";
import { Validator } from "../types";
import { Contract, utils } from "ethers";

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

