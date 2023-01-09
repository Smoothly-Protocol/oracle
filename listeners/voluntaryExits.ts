import EventSource from "eventsource";
import * as dotenv from 'dotenv';
import { collections } from "../db/src/database.service";
import { Contract } from "ethers";
import { deactivateValidator } from "./deactivateUser";

export async function startVoluntaryExitsListener() {
	const eth2 = new EventSource(`${process.env.PRATER_NODE}/eth/v1/events?topics=voluntary_exit`);
  eth2.addEventListener('voluntary_exit', async (e) => {
		const { validator_index } = JSON.parse(e.data.message);	
    const query = {validatorIndex: Number(validator_index)};
    if(collections.users != undefined) {
      const user = await collections.users.findOne(query);
      if(user) {
        deactivateValidator(user.pubKey);
        console.log("Voluntary exit from:", validator_index);
      }
    }
  })
  console.log("Listening to Voluntary Exits");
}

