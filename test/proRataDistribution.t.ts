import { assert } from "chai";
import { BigNumber, utils } from "ethers";
import { Oracle } from "../src/oracle";
import { Validator } from "../src/types";
import { fundUsers } from "../src/oracle/rebalancer";
import { STAKE_FEE, FEE, MISS_FEE } from "../src/utils";
import { setup, time1Day } from "./setup";
import { validators } from "./mock";

describe("proRata Distribution", () => {
  let total = utils.parseEther("0.2567908");
  let oracle: Oracle;
  let totalDistribution = total.mul(FEE).div(1000);
  let epochInterval: number;
  let lastEpoch: number;
  let timeLock: number;

  before(async () => {
    oracle = await setup();
    epochInterval = Number(await oracle.governance.epochInterval());
    lastEpoch = Number(await oracle.governance.lastEpoch());
    timeLock = Number(lastEpoch) + Number(epochInterval);
  })

  beforeEach(async () => {
    for(let v of validators) {
     v.rewards = BigNumber.from("0");
     await oracle.db.insert(v.index, v);
    }
  });

  it("should fund users same amount ", async() => {
    const fee = await fundUsers(validators, total, oracle.db, timeLock, epochInterval);
    let t = BigNumber.from("0").add(fee);
    for(let v of validators) {
      const validator = await oracle.db.get(v.index) as Validator;
      t = t.add(validator.rewards);
    }
    assert.equal(total._hex, t._hex);
  });

  it("should fund users taking account proRata", async() => {
    validators[2].registrationTime = timeLock - (3.5 * 86400);
    const _fee = total.mul(FEE).div(1000);
    const maxShare = total.sub(_fee).div(validators.length);
    const fee = await fundUsers(validators, total, oracle.db, timeLock, epochInterval);
    let t = BigNumber.from("0").add(fee);
    for(let v of validators) {
      t = t.add(v.rewards);
      if(v.index == 300) {
        let proRata = 0.5;
        let rewardShare = maxShare.mul(Math.round(proRata * 1000)).div(1000);
        assert.equal(v.rewards.lt(maxShare), true); 
        assert.deepEqual(rewardShare, v.rewards);
      } else {
        assert.equal(v.rewards.gt(maxShare), true); 
      }
    }
    assert.equal(total._hex, t._hex);
  });

  it("should not break if registraion happens after timeLock", async() => {
    validators[2].registrationTime = timeLock + 1000;
    const _fee = total.mul(FEE).div(1000);
    const maxShare = total.sub(_fee).div(validators.length);
    const fee = await fundUsers(validators, total, oracle.db, timeLock, epochInterval);
    let t = BigNumber.from("0").add(fee);
    for(let v of validators) {
      t = t.add(v.rewards);
      if(v.index == 300) {
        assert.deepEqual(v.rewards, BigNumber.from("0"));
      } else {
        assert.equal(v.rewards.gt(maxShare), true); 
      }
    }
    assert.equal(total._hex, t._hex);
  });

});
