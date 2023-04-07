import { assert, expect } from "chai";
import { utils, BigNumber } from "ethers";
import { setup } from "./setup";
import { validators } from "./mock";
import { Oracle, WithdrawalRequested } from "../src/oracle";
import { API } from "../src/api";
import { Validator } from "../src/types";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { delay } from "./utils";
import fs from "fs";
import * as path from 'path';

describe("API", () => {
  let oracle: Oracle;
  let api: API;

  before(async () => {
    oracle = await setup();

    // Simulate registration
    for(let v of validators) {
      await oracle.db.insert(v.index, v);
      await oracle.signer.sendTransaction({
        value: utils.parseEther("0.65"),
        to: oracle.contract.address
      }) 
    }
    api = new API(oracle, 4000);
  });

  const sendEtherPool = async (amount: string) => {
    await oracle.signer.sendTransaction({
      value: utils.parseEther(amount),
      to: oracle.contract.address
    });
  }

  describe("Pool Stats", () => {
    it("retrieves pool stats correctly", async () => {
      const validator1: Validator = validators[0];
      const validator2: Validator = validators[1];
      validator1.rewards = utils.parseEther("0.1");
      validator1.firstBlockProposed = true;
      validator2.rewards = utils.parseEther("0.25");
      validator2.firstBlockProposed = true;
      await sendEtherPool("0.4");
      await oracle.db.insert(validator1.index, validator1);
      await oracle.db.insert(validator2.index, validator2);
      await oracle.rebalance();
      const stats = await getPoolStats(await oracle.getRoot()); 
      assert.equal(stats.awaiting_activation, 3);
      assert.equal(stats.activated, 2);
      assert.equal(
        BigNumber.from(stats.total_rewards)
        .eq(utils.parseEther("0.39925")), true);// (0.05 rebalanced - fee) + awarded rewards
      assert.equal(
        BigNumber.from(stats.total_stake)
        .eq(utils.parseEther("0.65").mul(5)), true);
      assert.equal(
        BigNumber.from(stats.total_value_period)
        .eq(utils.parseEther("0")), true);
      assert.equal(stats.total_miss, 0);
      assert.equal(stats.total_fee, 0);
    }); 

    it("computes withdrawals correctly", async () => {
      const validator: Validator = validators[0];
			const data: any = JSON.parse(
				fs.readFileSync(
					path.resolve(__dirname, "../.smoothly/withdrawals.json"),
					'utf8'
				)
			)
			const tree = StandardMerkleTree.load(data);   
      let args: Array<any> = [];
      for (const [i, v] of tree.entries()) {
        if (v[0] === validator.eth1) {
          args[0] = tree.getProof(i);
          args[1] = v[1];
          args[2] = v[2];
          break;
        }
      }
      await oracle.contract.withdrawRewards(args[0], args[1], args[2])
      WithdrawalRequested(oracle);
      await delay(5000);
      const stats = await getPoolStats(await oracle.getRoot()); 
      assert.equal(
        BigNumber.from(stats.total_withdrawals)
        .eq(utils.parseEther("0.3697")), true);
      assert.equal(
        BigNumber.from(stats.total_value)
        .eq(BigNumber.from(stats.total_rewards).add(stats.total_withdrawals)), true);
    }).timeout(10000); 
  })

  describe("Validator", () => {
    it("retrieves validator status with proofs", async () => {
      const data = await getValidatorData(validators[0].eth1); 
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
  const url = `http://localhost:4000/validators/${eth1Addr}`;
    const headers = {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  }
  return await (await fetch(url, headers)).json();
}

