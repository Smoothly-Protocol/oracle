import { assert } from "chai";
import { Oracle } from "../src/oracle";
import { 
  processRebalance, 
  fundUsers,
  proposeEpoch,
  generateTrees
} from "../src/oracle/rebalancer";
import { setup, pks, time1Day } from "./setup";
import { checkpoint } from "./mock";
import { BigNumber, utils } from "ethers";
import { Validator, TrieRebalance } from "../src/types";

//disable logs
//console.log = function () {};

describe("Simulation Test", () => {
  let oracle: Oracle;
  let initRewards: BigNumber = BigNumber.from("0");
  let initStake: BigNumber = BigNumber.from("0");
  let initBalance: BigNumber = BigNumber.from("0");

  before(async() => {
    oracle = await setup();
    await oracle.syncJson(checkpoint);

    for(let validator of checkpoint.data) {
      if(BigNumber.from(validator.rewards).lt(0)) {
        console.warn("Overdrawn rewards balance for:", validator.index); 
      } else if(BigNumber.from(validator.rewards).lt(0)) {
        console.warn("Overdrawn stake balance for:", validator.index); 
      } else if(BigNumber.from(validator.stake).gt(utils.parseEther("0.065"))) {
        console.warn("stake balance too big for:", validator.index); 
      }
      initRewards = initRewards.add(BigNumber.from(validator.rewards));
      initStake = initStake.add(BigNumber.from(validator.stake));
    }

    initBalance = initBalance.add(initRewards).add(initStake);
    await oracle.signer.sendTransaction({
      value: initBalance,
      to: oracle.contract.address
    });
  });

  it("computes correct root", () => {
    const root = oracle.db.root().toString('hex');
    assert.equal(root, checkpoint.root);
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

    it("throws if total < 0.001 eth correctly", async () => {
      try {
        const { includedValidators, tRewards, tStake } = await processRebalance(oracle.db);
        const total = (await oracle.getBalance("latest")).sub(tRewards.add(tStake));
        const fee = await fundUsers(includedValidators, total, oracle.db);
      } catch(err: any) {
        assert.equal(err, "No funds to rebalance on this period");
      }
    })

  });
  
  describe("Simulation with live data on rebalance", () => {

    before(async () => {
      // Missed proposal: validator with index 432307
      // Missed proposal: validator with index 432278
      // Missed proposal: validator with index 432269
      // Missed proposal: validator with index 432215
      // Missed proposal: validator with index 472362
      const indexes = [432307, 432278, 432269, 432215, 472362];
      for(let i of indexes) {
        const validator = await oracle.db.get(i) as Validator;
        validator.slashMiss = 1;
        await oracle.db.insert(i, validator);
      }
    });

    it("computes correct root", () => {
      const root = oracle.db.root().toString('hex');
      assert.equal(root, '8e84c7cf404ef4beacfd6aa6da60f7eb0cab4a8a155f6d1a8ee69da70393ebad');
    })

    it("No Slashes no money coming in should throw No funds to rebalance", async () => {
      try {
        const db = oracle.db;
        const { includedValidators, tRewards, tStake } = await processRebalance(db);
        const total = (await oracle.getBalance("latest")).sub(tRewards.add(tStake));

        assert.deepEqual(total, BigNumber.from("0"));
        assert.deepEqual(tRewards, initRewards);
        assert.deepEqual(tStake, initStake);

        const fee = await fundUsers(includedValidators, total, db);
        const [withdrawalsRoot, exitsRoot] = await generateTrees(db);
        const epochData = [withdrawalsRoot, exitsRoot, db.root(), fee];

        await time1Day(oracle.contract.provider);
        await proposeEpoch(epochData, oracle, 0);
      } catch(err: any) {
        assert.equal(err, "No funds to rebalance on this period");
      }
    })

  });

  describe("0.1 ETH to rebalance", () => {

    before(async () => {
      await oracle.signer.sendTransaction({
        value: utils.parseEther("0.1"),
        to: oracle.contract.address
      });
    });

    it("calculates amount to rebalance and fee correctly", async () => {
      const db = oracle.db;
      const { includedValidators, tRewards, tStake } = await processRebalance(db);
      const total = (await oracle.getBalance("latest")).sub(tRewards.add(tStake));
      const fee = await fundUsers(includedValidators, total, db);
      const [withdrawalsRoot, exitsRoot] = await generateTrees(db);
      const epochData = [withdrawalsRoot, exitsRoot, db.root(), fee];

      await time1Day(oracle.contract.provider);
      await proposeEpoch(epochData, oracle, 0);

      assert.deepEqual(total, utils.parseEther("0.1"));
      assert.deepEqual(fee, utils.parseEther("0.0015"));
    })

    it("makes sure amount is rebalanced", async () => {
      const { includedValidators, tRewards, tStake } = await processRebalance(oracle.db);
      const total = (await oracle.getBalance("latest")).sub(tRewards.add(tStake));
      
      assert.equal(
        total.lt(utils.parseUnits("300", "wei")), 
        true 
      );
    })

  });

  describe("0.1 ETH to rebalance with zero out", () => {

    before(async () => {
      await oracle.signer.sendTransaction({
        value: utils.parseEther("0.11"),
        to: oracle.contract.address
      });
      // Update validator rewards to test zero out
      const validator = await oracle.db.get(472327) as Validator;
      validator.rewards = utils.parseEther("0.01");
      validator.slashMiss = 1;
      await oracle.db.insert(472327, validator);
    });

    it("calculates amount to rebalance and fee correctly", async () => {
      const db = oracle.db;
      const { includedValidators, tRewards, tStake } = await processRebalance(db);
      const total = (await oracle.getBalance("latest")).sub(tRewards.add(tStake));
      const fee = await fundUsers(includedValidators, total, db);
      const [withdrawalsRoot, exitsRoot] = await generateTrees(db);
      const epochData = [withdrawalsRoot, exitsRoot, db.root(), fee];

      await time1Day(oracle.contract.provider);
      await proposeEpoch(epochData, oracle, 0);

      const validator = await oracle.db.get(472327) as Validator;
      assert.deepEqual(BigNumber.from(validator.rewards), BigNumber.from("0"));
      assert.equal(
        total.sub(utils.parseEther("0.11")).lt(utils.parseUnits("300", "wei")),
        true
      );
      assert.equal(
        fee.sub(utils.parseEther("0.00165")).lt(utils.parseUnits("300", "wei")),
        true
      )
    })

    it("makes sure amount is rebalanced", async () => {
      const { includedValidators, tRewards, tStake } = await processRebalance(oracle.db);
      const total = (await oracle.getBalance("latest")).sub(tRewards.add(tStake));
      assert.equal(total.lt(utils.parseUnits("300", "wei")), true);
    })

  });

  describe("0.1 ETH to rebalance with missed proposal slash", () => {

    before(async () => {
      await oracle.signer.sendTransaction({
        value: utils.parseEther("0.1"),
        to: oracle.contract.address
      });
      // Update validator rewards to test zero out
      const validator = await oracle.db.get(472307) as Validator;
      validator.slashMiss = 1;
      validator.firstMissedSlot = true;
      await oracle.db.insert(472307, validator);
    });

    it("calculates amount to rebalance and fee correctly", async () => {
      const db = oracle.db;
      const { includedValidators, tRewards, tStake } = await processRebalance(db);
      const total = (await oracle.getBalance("latest")).sub(tRewards.add(tStake));
      const fee = await fundUsers(includedValidators, total, db);
      const [withdrawalsRoot, exitsRoot] = await generateTrees(db);
      const epochData = [withdrawalsRoot, exitsRoot, db.root(), fee];

      await time1Day(oracle.contract.provider);
      await proposeEpoch(epochData, oracle, 0);

      const validator = await oracle.db.get(472307) as Validator;
      assert.deepEqual(BigNumber.from(validator.stake), utils.parseEther("0.050"));
      assert.equal(
        total.sub(utils.parseEther("0.115")).lt(utils.parseUnits("300", "wei")),
        true
      );
      assert.equal(
        fee.sub(utils.parseEther("0.001725")).lt(utils.parseUnits("300", "wei")),
        true
      )
    })

    it("makes sure amount is rebalanced", async () => {
      const { includedValidators, tRewards, tStake } = await processRebalance(oracle.db);
      const total = (await oracle.getBalance("latest")).sub(tRewards.add(tStake));
      assert.equal(total.lt(utils.parseUnits("300", "wei")), true);
    })

  });
  
});
