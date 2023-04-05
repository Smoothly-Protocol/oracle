import { assert, expect } from "chai";
import { utils, BigNumber } from "ethers";
import { setup } from "./setup";
import { validators } from "./mock";
import { Oracle } from "../src/oracle";
import { API } from "../src/api";

describe("API", () => {
  let oracle: Oracle;
  let api: API;

  before(async () => {
		oracle = await setup();
		for(let v of validators) {
			// Simulate registration
			await oracle.db.insert(v.index, v);
			await oracle.signer.sendTransaction({
				value: utils.parseEther("0.65"),
				to: oracle.contract.address
			});
		} 
    api = new API(oracle, 4000);
  });

  describe("Pool Stats", () => {
    it("retrieves pool stats correctly", async () => {
     const stats = await getPoolStats(await oracle.getRoot()); 
     console.log(stats);
    }); 
  })

  describe("Validator", () => {
    it("retrieves validator status with proofs", async () => {
     const data = await getValidatorData(validators[0].eth1); 
     console.log(data);
    }).timeout(20000); 
  })
})

async function getPoolStats(root: string) {
  const url = `http://localhost:4000/poolstats/${root}`;
  const headers = {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  }
  return await (await fetch(url, headers)).json();
}

async function getValidatorData(eth1Addr: string) {
  const url = `http://localhost:4000/validator/${eth1Addr}`;
  const headers = {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  }
  return await (await fetch(url, headers)).json();
}
