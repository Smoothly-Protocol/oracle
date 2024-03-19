import { assert } from "chai";
import { setup, time1Day, provider, getBlockNumber } from "./setup";
import { BigNumber, providers, Contract, Wallet, utils } from "ethers";
import { Oracle } from '../src/oracle';
import { Validator } from "../src/types";
import { validateSlot , reqSlotInfo } from "../src/oracle/epoch";
import { Rebalancer } from "../src/oracle/rebalancer";
import { STAKE_FEE, EMPTY_ROOT } from "../src/utils";
import { DB } from "../src/db";
import { MonitorRelays } from '../src/oracle/relays';
import { delay } from "./utils";

describe("Relay", () => {
  let oracle: Oracle;
  let validators = [
  {
    index :31130,
    eth1:"0x2fe55ecd0813821a209a944888206cc4dafcbe17",
    rewards: BigNumber.from("0"),
    slashMiss:0,
    slashFee:0,
    stake: utils.parseEther("0.065"),
    registrationTime: 0,
    firstBlockProposed:false,
    firstMissedSlot:false,
    excludeRebalance:false,
    exitRequested:false,
    active:true,
    deactivated:false
  },
  {
    index:31129,
    eth1:"0x2fe55ecd0813821a209a944888206cc4dafcbe17",
    rewards: BigNumber.from("0"),
    slashMiss:0,
    slashFee:0,
    stake: utils.parseEther("0.065"),
    registrationTime: 0,
    firstBlockProposed:true,
    firstMissedSlot:false,
    excludeRebalance:false,
    exitRequested:false,
    active:true,
    deactivated:false
  },
  {
    index:12660,
    eth1:"0x2fe55ecd0813821a209a944888206cc4dafcbe17",
    rewards: BigNumber.from("0"),
    slashMiss:0,
    slashFee:0,
    stake: utils.parseEther("0.065"),
    registrationTime: 0,
    firstBlockProposed:false,
    firstMissedSlot:false,
    excludeRebalance:false,
    exitRequested:false,
    active:true,
    deactivated:false
  }
  ];
  const beacon = "http://testing.mainnet.beacon-api.nimbus.team";
  const relays = [
    'https://relay.ultrasound.money',
    'https://aestus.live',
    'https://agnostic-relay.net',
    'https://boost-relay.flashbots.net',
    'https://mainnet-relay.securerpc.com',
    'https://bloxroute.max-profit.blxrbdn.com'
  ];
  const pool = "0x43670D6f39Bca19EE26462f62339e90A39B01e34"

  before(async () => {
    oracle = await setup();
    oracle.network.beacon = beacon;
    oracle.network.relays = relays;
    oracle.network.pool = pool;
    for(let v of validators) {
      // Simulate registration
      await oracle.db.insert(v.index, v);
    } 
  });

  beforeEach(async () => {
    await time1Day(provider);           
  })

  it('does not flag as excluded with older timestamps', async () => {
    await MonitorRelays(oracle);
    const lastEpoch = await oracle.governance.lastEpoch();
    const epochInterval = await oracle.governance.epochInterval();
    const timeLock = Number(lastEpoch) + Number(epochInterval);
    await Rebalancer(oracle, {block_number: "latest" , priority: 0, timeLock, epochInterval});
    for(let v of validators) {
      const finalValidator: Validator | undefined = await oracle.db.get(v.index);
      if(finalValidator) {
        assert.equal(finalValidator.excludeRebalance, false);
        assert.equal(finalValidator.excludeRebalance, false);
        assert.equal(finalValidator.excludeRebalance, false);
      }
    }
  }).timeout(20000);

  it('maintains validators that already got excluded on the period', async () => {
    validators[1].excludeRebalance = true; 
    await oracle.db.insert(31129, validators[1]);
    await MonitorRelays(oracle);
    for(let v of validators) {
      const finalValidator: Validator | undefined = await oracle.db.get(v.index);
      if(finalValidator) {
        if(v.index == 31129){
          assert.equal(finalValidator.excludeRebalance, true);
        } else {
          assert.equal(finalValidator.excludeRebalance, false);
        }
      }
    }
    const lastEpoch = await oracle.governance.lastEpoch();
    const epochInterval = await oracle.governance.epochInterval();
    const timeLock = Number(lastEpoch) + Number(epochInterval);
    await Rebalancer(oracle, {block_number: "latest" , priority: 0, timeLock, epochInterval});
  }).timeout(20000);

  it('resets after rebalance', async () => {
    validators[1].excludeRebalance = true; 
    await oracle.db.insert(31129, validators[1]);
    await MonitorRelays(oracle);
    for(let v of validators) {
      const finalValidator: Validator | undefined = await oracle.db.get(v.index);
      if(finalValidator) {
        if(v.index == 31129){
          assert.equal(finalValidator.excludeRebalance, true);
        } else {
          assert.equal(finalValidator.excludeRebalance, false);
        }
      }
    }
    const lastEpoch = await oracle.governance.lastEpoch();
    const epochInterval = await oracle.governance.epochInterval();
    const timeLock = Number(lastEpoch) + Number(epochInterval);
    await Rebalancer(oracle, {block_number: "latest" , priority: 0, timeLock, epochInterval});
    for(let v of validators) {
      const finalValidator: Validator | undefined = await oracle.db.get(v.index);
      if(finalValidator) {
        assert.equal(finalValidator.excludeRebalance, false);
        assert.equal(finalValidator.excludeRebalance, false);
        assert.equal(finalValidator.excludeRebalance, false);
      }
    }
  }).timeout(20000);

});

