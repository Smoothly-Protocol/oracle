import EventSource from "eventsource";
import { Oracle } from "../oracle";
import { Validator } from "../types";

//let data: string = '{"message":{"epoch":"1", "validator_index":"1"}, "signature":"0x1b66ac1fb663c9bc59509846d6ec05345bd908eda73e670af888da41af171505cc411d61252fb6cb3fa0017b679f8bb2305b26a285fa2737f175668d0dff91cc1b66ac1fb663c9bc59509846d6ec05345bd908eda73e670af888da41af171505"}';

export async function VoluntaryExits(oracle: Oracle) {
	const eth2 = new EventSource(`${oracle.network.beacon}/eth/v1/events?topics=voluntary_exit`);
  eth2.addEventListener('voluntary_exit', async (e) => {
    const { message } = JSON.parse(e.data);
    const { validator_index } = message;
    const validator: Validator | undefined = await oracle.db.get(validator_index);

    if(validator) {
      validator.active = false;
      await oracle.db.insert(validator_index, validator);
      console.log("Voluntary exit: validator with index", validator_index);
    }
  })
  console.log("Listening to Voluntary Exits");
}

