import { assert, expect } from "chai";
import { setup } from "./setup";
import { validators } from "./mock";
import { utils, Wallet, BigNumber } from "ethers";
import { Validator } from "../src/types";
import { Oracle } from "../src/oracle";
import { STAKE_FEE } from "../src/utils";

describe("Rebalancer", () => {
  let oracle: Oracle;

  before(async () => {
    oracle = await setup();
    for(let v of validators) {
      // Simulate registration
      v.rewards = utils.parseEther("0.1");
      await oracle.db.insert(v.index, v);
      await oracle.signer.sendTransaction({
        value: utils.parseEther("0.65"),
        to: oracle.contract.address
      });
    } 
  })

  beforeEach(async () => {
    // Simulate value recieved by validators 
    await oracle.signer.sendTransaction({
      value: utils.parseEther("0.5"),
      to: oracle.contract.address
    });
  });

  describe("First block not proposed", () => {
    it("zeros out validator on bad fee_recipient", async () => {
      const startValidator: Validator | undefined = await oracle.db.get(100);
      if(startValidator !== undefined) {
        startValidator.slashFee = 1;
        await oracle.db.insert(100, startValidator); 
        await oracle.rebalance();
      }
      const finalValidator: Validator | undefined = await oracle.db.get(100);
      if(finalValidator !== undefined) {
        assert.equal(finalValidator.slashFee, 0);  
        assert.deepEqual(BigNumber.from(finalValidator.stake), utils.parseEther("0.65"));
        assert.deepEqual(BigNumber.from(finalValidator.rewards), BigNumber.from("0"));  
      }
    })

    it("zeros out validator on missed proposal", async () => {
      const startValidator: Validator | undefined = await oracle.db.get(100);
      if(startValidator !== undefined) {
        startValidator.slashMiss = 1;
        await oracle.db.insert(100, startValidator); 
        await oracle.rebalance();
      }
      const finalValidator: Validator | undefined = await oracle.db.get(100);
      if(finalValidator !== undefined) {
        assert.equal(finalValidator.slashMiss, 0);  
        assert.deepEqual(BigNumber.from(finalValidator.stake), utils.parseEther("0.65"));
        assert.deepEqual(BigNumber.from(finalValidator.rewards), BigNumber.from("0"));  
      }
    })
  })

  describe("First block proposed", () => {

    it("slashes validator on bad fee_recipient", async () => {
      const startValidator: Validator | undefined = await oracle.db.get(100);
      if(startValidator !== undefined) {
        startValidator.slashFee = 1;
        startValidator.firstBlockProposed = true;
        await oracle.db.insert(100, startValidator); 
      }
      await oracle.rebalance();
      const finalValidator: Validator | undefined = await oracle.db.get(100);
      if(finalValidator !== undefined) {
        assert.equal(finalValidator.slashFee, 0);  
        assert.deepEqual(BigNumber.from(finalValidator.stake), utils.parseEther("0.15"));
        assert.deepEqual(BigNumber.from(finalValidator.rewards), utils.parseEther("0"));  
      }
    })

    it("avoids slash of first missed proposal", async () => {
      const startValidator: Validator | undefined = await oracle.db.get(100);
      if(startValidator !== undefined) {
        startValidator.slashMiss = 1;
        await oracle.db.insert(100, startValidator); 
      }
      await oracle.rebalance();
      const finalValidator: Validator | undefined = await oracle.db.get(100);
      if(finalValidator !== undefined) {
        assert.equal(finalValidator.slashMiss, 0);  
        assert.deepEqual(BigNumber.from(finalValidator.stake), utils.parseEther("0.15"));
        assert.deepEqual(BigNumber.from(finalValidator.rewards), utils.parseEther("0"));  
        assert.equal(finalValidator.firstMissedSlot, true);  
      }
    })

    it("slashes validator on second missed proposal", async () => {
      const startValidator: Validator | undefined = await oracle.db.get(100);
      if(startValidator !== undefined) {
        startValidator.slashMiss = 1;
        await oracle.db.insert(100, startValidator); 
      }
      await oracle.rebalance();
      const finalValidator: Validator | undefined = await oracle.db.get(100);
      if(finalValidator !== undefined) {
        assert.equal(finalValidator.slashMiss, 0);  
        assert.deepEqual(BigNumber.from(finalValidator.stake), utils.parseEther("0"));
        assert.deepEqual(BigNumber.from(finalValidator.rewards), utils.parseEther("0"));  
      }
    })

    it("deactivates validator if runs out of stake", async () => {
      const startValidator: Validator | undefined = await oracle.db.get(100);
      if(startValidator !== undefined) {
        startValidator.slashMiss = 1;
        await oracle.db.insert(100, startValidator); 
      }
      await oracle.rebalance();
      const finalValidator: Validator | undefined = await oracle.db.get(100);
      if(finalValidator !== undefined) {
        assert.equal(finalValidator.slashMiss, 0);  
        assert.deepEqual(BigNumber.from(finalValidator.stake), utils.parseEther("0"));
        assert.deepEqual(BigNumber.from(finalValidator.rewards), utils.parseEther("0"));  
        assert.deepEqual(finalValidator.active, false);  
      }
    })
  })
})
