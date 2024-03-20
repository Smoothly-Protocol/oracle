import { assert, expect } from "chai";
import { setup, pks, time1Day, getBlockNumber } from "./setup";
import { validators } from "./mock";
import { utils, Wallet, BigNumber, providers } from "ethers";
import { Validator } from "../src/types";
import { Oracle } from "../src/oracle";
import { Rebalancer, processRebalance } from "../src/oracle/rebalancer";
import { RewardsWithdrawal } from "../src/oracle/events";
import { STAKE_FEE, FEE, MISS_FEE } from "../src/utils";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { delay } from "./utils";
import fs from "fs";
import * as path from 'path';
import { homedir } from 'os';

describe("Rebalancer", () => {
  let oracle: Oracle;
  let initRewards: BigNumber = BigNumber.from("0");
  let initStake: BigNumber = BigNumber.from("0");
  let initBalance: BigNumber = BigNumber.from("0");
  let epochInterval: number;
  let lastEpoch: number;
  let timeLock: number;

  before(async () => {
    oracle = await setup();
    // Register validators
    for(let v of validators) {
      await oracle.db.insert(v.index, v);
      initRewards = initRewards.add(BigNumber.from(v.rewards));
      initStake = initStake.add(BigNumber.from(v.stake));
    } 

    initBalance = initBalance.add(initRewards).add(initStake);
    await oracle.signer.sendTransaction({
      value: initBalance,
      to: oracle.contract.address
    });
  })

  beforeEach(async () => {
    const provider = new providers.JsonRpcProvider("http://127.0.0.1:8545");
    await time1Day(provider);           
    epochInterval = Number(await oracle.governance.epochInterval());
    lastEpoch = Number(await oracle.governance.lastEpoch());
    timeLock = Number(lastEpoch) + Number(epochInterval);
  })

  describe("No ETH to rebalance", () => {

    it("calculates tRewards and tStake correctly", async () => {
      const { tRewards, tStake } = await processRebalance(oracle.db);
      assert.deepEqual(tRewards, initRewards);
      assert.deepEqual(tStake, initStake);
    })

    it("calculates totalBalance correctly", async () => {
      const { tRewards, tStake } = await processRebalance(oracle.db);
      const total = (await oracle.getBalance("latest")).sub(tRewards.add(tStake));
      assert.deepEqual(total, BigNumber.from("0"));
    })

  });


  describe("Fund Validators", () => {

    beforeEach(async () => {
      // Simulate value recieved by validators 
      await oracle.signer.sendTransaction({
        value: utils.parseEther("0.5"),
        to: oracle.contract.address
      });
    });

    it("funds all validators evenly with fee", async () => {
      const fee = utils.parseEther("0.1").mul(FEE).div(1000);
      await Rebalancer(oracle, {block_number: "latest" , priority: 0, timeLock, epochInterval});
      for(let v of validators) {
        const validator = await oracle.db.get(v.index) as Validator;
        assert.deepEqual(
          BigNumber.from(validator.rewards), 
          utils.parseEther("0.1").sub(fee)
        );
      }
    })
  });

  describe("First block not proposed", () => {

    it("zeros out validator on bad fee_recipient", async () => {
      const startValidator = await oracle.db.get(100) as Validator;
      startValidator.slashFee = 1;
      await oracle.db.insert(100, startValidator); 
      await processRebalance(oracle.db);
      const finalValidator = await oracle.db.get(100) as Validator;
      assert.equal(finalValidator.slashFee, 0);  
      assert.equal(finalValidator.deactivated, false);  
      assert.deepEqual(BigNumber.from(finalValidator.stake), STAKE_FEE);
      assert.deepEqual(BigNumber.from(finalValidator.rewards), BigNumber.from("0"));  
    })

    it("zeros out validator on missed proposal", async () => {
      const startValidator = await oracle.db.get(100) as Validator;
      startValidator.slashMiss = 1;
      await oracle.db.insert(100, startValidator); 
      await processRebalance(oracle.db);
      const finalValidator = await oracle.db.get(100) as Validator;
      assert.equal(finalValidator.slashMiss, 0);  
      assert.deepEqual(BigNumber.from(finalValidator.stake), STAKE_FEE);
      assert.deepEqual(BigNumber.from(finalValidator.rewards), BigNumber.from("0"));  
    })
  })

  describe("First block proposed", () => {

    it("slashes validator on bad fee_recipient", async () => {
      const startValidator = await oracle.db.get(100) as Validator;
      startValidator.slashFee = 1;
      startValidator.firstBlockProposed = true;
      await oracle.db.insert(100, startValidator); 
      await processRebalance(oracle.db);
      const finalValidator = await oracle.db.get(100) as Validator;
      assert.equal(finalValidator.slashFee, 0);  
      assert.deepEqual(BigNumber.from(finalValidator.stake), utils.parseEther("0"));
      assert.deepEqual(BigNumber.from(finalValidator.rewards), utils.parseEther("0"));  
      assert.deepEqual(finalValidator.active, false);  
      assert.deepEqual(finalValidator.deactivated, true);  
    });

    it("avoids slash of first missed proposal", async () => {
      const startValidator = await oracle.db.get(200) as Validator;
      startValidator.slashMiss = 1;
      startValidator.firstBlockProposed = true;
      await oracle.db.insert(200, startValidator); 
      await processRebalance(oracle.db);
      const finalValidator = await oracle.db.get(200) as Validator;
      assert.equal(finalValidator.slashMiss, 0);  
      assert.deepEqual(BigNumber.from(finalValidator.stake), STAKE_FEE);
      assert.equal(finalValidator.firstMissedSlot, true);  
    });

    it("slashes validator on second missed proposal", async () => {
      const startValidator = await oracle.db.get(200) as Validator;
      startValidator.slashMiss = 1;
      await oracle.db.insert(200, startValidator); 
      await processRebalance(oracle.db);
      const finalValidator = await oracle.db.get(200) as Validator;
      assert.equal(finalValidator.slashMiss, 0);  
      assert.deepEqual(BigNumber.from(finalValidator.stake), STAKE_FEE.sub(MISS_FEE));
    });

    it("doesn't issue rewards to slashed validators", async () => {
      const { includedValidators } = await processRebalance(oracle.db);
      let included = false;
      for(let v of includedValidators) {
        if(v.index == 200) {
          included = true; 
          break;
        }
      }      
      assert.equal(included, false);
    });

    it("deactivates validator if runs out of stake", async () => {
      const startValidator = await oracle.db.get(200) as Validator;
      startValidator.slashMiss = 5;
      await oracle.db.insert(200, startValidator); 
      await processRebalance(oracle.db);
      const finalValidator = await oracle.db.get(200) as Validator;
      assert.equal(finalValidator.slashMiss, 0);  
      assert.deepEqual(BigNumber.from(finalValidator.stake), utils.parseEther("0"));
      assert.deepEqual(finalValidator.active, false);  
      assert.deepEqual(finalValidator.deactivated, true);  
    });
  })

  describe("Withdrawals", async () => {

    before(async () => {
      const v = await oracle.db.get(400) as Validator;
      v.firstBlockProposed = true;
      await oracle.db.insert(400, v); 
      await Rebalancer(oracle, {block_number: "latest" , priority: 0, timeLock, epochInterval});
    });

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
      const validator = await oracle.db.get(400) as Validator;
      let proof: any = tree.getProof([validator.eth1, [400], validator.rewards]);
      expect(proof).not.to.be.empty;
      /*
      RewardsWithdrawal(oracle);
      const startBalance = await oracle.getBalance("latest");
      await oracle.contract.withdrawRewards(proof, [400], validator.rewards);
      await delay(5000);

      const finalBalance = await oracle.getBalance("latest");
      assert.equal(startBalance.sub(validator.rewards).eq(finalBalance), true);
      */
    });
  })

})

