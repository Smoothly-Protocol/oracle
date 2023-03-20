import EventSource from "eventsource";
import { Oracle } from "../oracle";
import { Validator } from "../types";

let data: string = '{"message":{"epoch":"1", "validator_index":"1"}, "signature":"0x1b66ac1fb663c9bc59509846d6ec05345bd908eda73e670af888da41af171505cc411d61252fb6cb3fa0017b679f8bb2305b26a285fa2737f175668d0dff91cc1b66ac1fb663c9bc59509846d6ec05345bd908eda73e670af888da41af171505"}';

export async function VoluntaryExits(oracle: Oracle) {
	const eth2 = new EventSource(`${oracle.network.beacon}/eth/v1/events?topics=voluntary_exit`);
  eth2.addEventListener('voluntary_exit', async (e) => {
    const { message } = JSON.parse(data);
    const { validator_index } = message;
    const eth1Addr = await findEth1Addr(validator_index, oracle);

    let user: Validator | undefined = await oracle.db.get(eth1Addr, validator_index);
    if(user) {
      user.active = false;
      await oracle.db.insert(eth1Addr, validator_index, user);
      console.log("Voluntary exit: validator with index", validator_index);
    }
  })
  console.log("Listening to Voluntary Exits");
}

async function findEth1Addr(index: number, oracle: Oracle) {
  const contract = oracle.contract;
  const logs = contract.filters.Registered(index);
  const filter = await contract.queryFilters(logs);
  return filter[0].args[1]; 
}
