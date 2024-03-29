import { assert, expect } from "chai";
import { setup, pks, time1Day, getBlockNumber } from "./setup";
import { validators } from "./mock";
import { utils, Wallet, BigNumber, providers } from "ethers";
import { Validator } from "../src/types";
import { Oracle } from "../src/oracle";
import { Rebalancer } from "../src/oracle/rebalancer";
import { RewardsWithdrawal } from "../src/oracle/events";
import { STAKE_FEE, FEE, MISS_FEE } from "../src/utils";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { delay } from "./utils";
import fs from "fs";
import * as path from 'path';
import { homedir } from 'os';

describe("Rebalancer", () => {
  let oracle: Oracle;

  before(async () => {
    oracle = await setup();
    for(let v of validators) {
      // Simulate registration
      await oracle.db.insert(v.index, v);
      await oracle.signer.sendTransaction({
        value: STAKE_FEE,
        to: oracle.contract.address
      });
    } 
  })

  beforeEach(async () => {
    const provider = new providers.JsonRpcProvider("http://127.0.0.1:8545");
    await time1Day(provider);           
  })

  describe("Fund Validators", () => {
    beforeEach(async () => {
      // Simulate value recieved by validators 
      console.log(await oracle.signer.getBalance());
      await oracle.signer.sendTransaction({
        value: utils.parseEther("0.5"),
        to: oracle.contract.address
      });
    });

    it("funds all validators evenly with fee", async () => {
      const fee = utils.parseEther("0.1").mul(FEE).div(1000);
      await Rebalancer(oracle, {block_number: "latest" , priority: 0});
      await delay(5000);
      for(let v of validators) {
        const finalValidator: Validator | undefined = await oracle.db.get(v.index);
        if(finalValidator) {
          assert.deepEqual(
            BigNumber.from(finalValidator.rewards), 
            utils.parseEther("0.1").sub(fee)
          );  
        }
      }
    }).timeout(10000);
  });

  describe("First block not proposed", () => {
    beforeEach(async () => {
      // Simulate value recieved by validators 
      await oracle.signer.sendTransaction({
        value: utils.parseEther("0.5"),
        to: oracle.contract.address
      });
    });

    it("zeros out validator on bad fee_recipient", async () => {
      const startValidator: Validator | undefined = await oracle.db.get(100);
      if(startValidator) {
        startValidator.slashFee = 1;
        await oracle.db.insert(100, startValidator); 
        await Rebalancer(oracle, {block_number: "latest", priority: 0});
        await delay(5000);
      }
      const finalValidator: Validator | undefined = await oracle.db.get(100);
      if(finalValidator) {
        assert.equal(finalValidator.slashFee, 0);  
        assert.deepEqual(BigNumber.from(finalValidator.stake), STAKE_FEE);
        assert.deepEqual(BigNumber.from(finalValidator.rewards), BigNumber.from("0"));  
      }
    }).timeout(10000);

    it("zeros out validator on missed proposal", async () => {
      const startValidator: Validator | undefined = await oracle.db.get(100);
      if(startValidator) {
        startValidator.slashMiss = 1;
        await oracle.db.insert(100, startValidator); 
        await Rebalancer(oracle, {block_number: "latest", priority: 0});
        await delay(5000);
      }
      const finalValidator: Validator | undefined = await oracle.db.get(100);
      if(finalValidator) {
        assert.equal(finalValidator.slashMiss, 0);  
        assert.deepEqual(BigNumber.from(finalValidator.stake), STAKE_FEE);
        assert.deepEqual(BigNumber.from(finalValidator.rewards), BigNumber.from("0"));  
      }
    }).timeout(10000);
  })

  describe("First block proposed", () => {

    beforeEach(async () => {
      // Simulate value recieved by validators 
      await oracle.signer.sendTransaction({
        value: utils.parseEther("0.5"),
        to: oracle.contract.address
      });
    });

    it("slashes validator on bad fee_recipient", async () => {
      const startValidator: Validator | undefined = await oracle.db.get(100);
      if(startValidator) {
        startValidator.slashFee = 1;
        startValidator.firstBlockProposed = true;
        await oracle.db.insert(100, startValidator); 
      }
      await Rebalancer(oracle, {block_number: "latest", priority: 0});
      await delay(5000);
      const finalValidator: Validator | undefined = await oracle.db.get(100);
      if(finalValidator) {
        assert.equal(finalValidator.slashFee, 0);  
        assert.deepEqual(BigNumber.from(finalValidator.stake), utils.parseEther("0"));
        assert.deepEqual(BigNumber.from(finalValidator.rewards), utils.parseEther("0"));  
        assert.deepEqual(finalValidator.active, false);  
        assert.deepEqual(finalValidator.deactivated, true);  
      }
    }).timeout(10000);

    it("avoids slash of first missed proposal", async () => {
      const startValidator: Validator | undefined = await oracle.db.get(200);
      if(startValidator) {
        startValidator.slashMiss = 1;
        startValidator.firstBlockProposed = true;
        await oracle.db.insert(200, startValidator); 
      }
      await Rebalancer(oracle, {block_number: "latest", priority: 0});
      await delay(5000);
      const finalValidator: Validator | undefined = await oracle.db.get(200);
      if(finalValidator) {
        assert.equal(finalValidator.slashMiss, 0);  
        assert.deepEqual(BigNumber.from(finalValidator.stake), STAKE_FEE);
        assert.equal(finalValidator.firstMissedSlot, true);  
      }
    }).timeout(10000);

    it("slashes validator on second missed proposal", async () => {
      const startValidator: Validator | undefined = await oracle.db.get(200);
      if(startValidator) {
        startValidator.slashMiss = 1;
        await oracle.db.insert(200, startValidator); 
      }
      await Rebalancer(oracle, {block_number: "latest", priority: 0});
      await delay(5000);
      const finalValidator: Validator | undefined = await oracle.db.get(200);
      if(finalValidator) {
        assert.equal(finalValidator.slashMiss, 0);  
        assert.deepEqual(BigNumber.from(finalValidator.stake), STAKE_FEE.sub(MISS_FEE));
      }
    }).timeout(10000);

    it("doesn't issue rewards to slashed validators", async () => {
      const startValidator: Validator | undefined = await oracle.db.get(200);
      await Rebalancer(oracle, {block_number: "latest", priority: 0});
      await delay(5000);
      const finalValidator: Validator | undefined = await oracle.db.get(200);
      if(finalValidator && startValidator) {
        assert.deepEqual(
          BigNumber.from(finalValidator.rewards), 
          BigNumber.from(startValidator.rewards)
        );
      }
    }).timeout(10000);

    it("deactivates validator if runs out of stake", async () => {
      const startValidator: Validator | undefined = await oracle.db.get(200);
      if(startValidator) {
        startValidator.slashMiss = 5;
        await oracle.db.insert(200, startValidator); 
      }
      await Rebalancer(oracle, {block_number: "latest", priority: 0});
      await delay(5000);
      const finalValidator: Validator | undefined = await oracle.db.get(200);
      if(finalValidator) {
        assert.equal(finalValidator.slashMiss, 0);  
        assert.deepEqual(BigNumber.from(finalValidator.stake), utils.parseEther("0"));
        assert.deepEqual(finalValidator.active, false);  
        assert.deepEqual(finalValidator.deactivated, true);  
      }
    }).timeout(10000);
  })

  describe("Withdrawals", async () => {
    it("shouldn't allows a validator to withdraw wrong rewards", async () => {
      const data: any = JSON.parse(
        fs.readFileSync(
          path.resolve(homedir(), ".smoothly/withdrawals.json"),
          'utf8'
        )
      )
      const tree = StandardMerkleTree.load(data);   
      const validator = await oracle.db.get(200) as Validator;

      let proof: any = tree.getProof([validator.eth1, [200], validator.rewards]);
      let failed = false;
      try {
        await oracle.contract.withdrawRewards(proof, [200], utils.parseEther("100"));
      } catch {
        failed = true;
      }
      assert.equal(failed, true);;
    })

    it("allows a validator to withdraw their rewards", async () => {
      const data: any = JSON.parse(
        fs.readFileSync(
          path.resolve(homedir(), ".smoothly/withdrawals.json"),
          'utf8'
        )
      )
      const tree = StandardMerkleTree.load(data);   
      const validator = await oracle.db.get(200) as Validator;

      let proof: any = tree.getProof([validator.eth1, [200], validator.rewards]);

      RewardsWithdrawal(oracle);
      const startBalance = await oracle.getBalance("latest");
      await oracle.contract.withdrawRewards(proof, [200], validator.rewards);
      await delay(5000);

      const finalBalance = await oracle.getBalance("latest");
      assert.equal(startBalance.sub(validator.rewards).eq(finalBalance), true);
    }).timeout(20000);

  })

  after("state matches contract balance", async () => {
    let tRewards: BigNumber = BigNumber.from("0");
    let tStake: BigNumber = BigNumber.from("0");
    const balance = await oracle.getBalance("latest");
    const stream = await oracle.db.getStream();
    await new Promise((fulfilled) => { 
      stream
      .on('data', async (data: any) => {
        let validator = JSON.parse(data.value.toString());
        tRewards = tRewards.add(validator.rewards);
        tStake = tStake.add(validator.stake);
      })
      .on('end', fulfilled);
    });
    assert.equal(
      utils.formatUnits(balance, 9), 
      utils.formatUnits(tRewards.add(tStake), 9)
    );
  });
})

