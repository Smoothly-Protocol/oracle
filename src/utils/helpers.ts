import { Oracle } from "../oracle";
import { Validator } from "../types";

type RegisterLog = [string, number];
type ValidatorEth1 = {
  eth1Addr: string,
  validator?: Validator
};

export async function findEth1Addr(
  index: number, 
  oracle: Oracle 
): Promise<ValidatorEth1> {
  const logs = oracle.contract.filters.Registered(null, index);
  const filter = await oracle.contract.queryFilter(logs);
  /*
  filter.forEach(async (e: RegisterLog) => {
    const validator = await oracle.db.get(e[0], e[1]);
    if(validator) {
      return { 
        eth1Addr: e[0], 
        validator: validator
      };
    }
  })
 */
  return { eth1Addr: "", validator: undefined }; 
}
