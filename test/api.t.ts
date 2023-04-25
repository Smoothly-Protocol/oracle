import { assert, expect } from "chai";
import { utils, BigNumber, providers } from "ethers";
import { setup, pks, time1Day } from "./setup";
import { EMPTY_ROOT, STAKE_FEE } from "../src/utils";
import { validators } from "./mock";
import { Oracle } from "../src/oracle";
import { RewardsWithdrawal  } from "../src/oracle/events";
import { API } from "../src/api";
import { Validator } from "../src/types";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { delay } from "./utils";
import fs from "fs";
import * as path from 'path';
import { homedir } from 'os';

describe("API", () => {
  let oracle: Oracle;
  let api: API;

  before(async () => {
    oracle = await setup();

    // Simulate registration
    for(let v of validators) {
      await oracle.db.insert(v.index, v);
      await oracle.signer.sendTransaction({
        value: STAKE_FEE,
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

  beforeEach(async () => {
    const provider = new providers.JsonRpcProvider("http://127.0.0.1:8545");
    await time1Day(provider);           
  })

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
        BigNumber.from(stats.total_stake)
        .eq(STAKE_FEE.mul(5)), 
        true
      );
      /*
      assert.equal(
        BigNumber.from(stats.total_rewards)
        .eq(utils.parseEther("0.39925")), 
        true
      );// (0.05 rebalanced - fee) + awarded rewards
      assert.equal(
        BigNumber.from(stats.total_value_period)
        .eq(utils.parseEther("0")), 
        true
      );
      */
      assert.equal(stats.total_miss, 0);
      assert.equal(stats.total_fee, 0);
    }); 

    it("computes withdrawals correctly", async () => {
      const validator: Validator = validators[0];
      const data: any = JSON.parse(
        fs.readFileSync(
          path.resolve(homedir(), ".smoothly/withdrawals.json"),
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
      RewardsWithdrawal(oracle);
      await delay(5000);
      const stats = await getPoolStats(await oracle.getRoot()); 
      assert.equal(
        BigNumber.from(stats.total_withdrawals)
        .eq(utils.parseEther("0.367")), 
        true
      );
      assert.equal(
        BigNumber.from(stats.total_value)
        .eq(BigNumber.from(stats.total_rewards).add(stats.total_withdrawals)), 
        true
      );
    }).timeout(10000); 
  })

  describe("Validator", () => {
    it("retrieves validator status with proofs", async () => {
      const data = await getValidatorData(validators[0].eth1); 
    }).timeout(20000); 
  })

  describe("Checkpoint", () => {
    it("syncs node2 to active nodes state", async () => {
      const oracle2 = new Oracle("local", pks[1], EMPTY_ROOT);
      await oracle2.sync("http://localhost:4000");
      console.log(await oracle.getRoot())
      assert.equal(
        await oracle.getRoot(),
        await oracle2.getRoot()
      );
    }).timeout(20000); 
  });
})

async function getPoolStats(root: string) {
  const url = `http://localhost:4000/poolstats`;
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

