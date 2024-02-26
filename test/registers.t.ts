import { assert, expect } from "chai";
import { providers, Contract, Wallet, utils } from "ethers";
import { setup } from "./setup";
import { delay } from "./utils";
import { Oracle } from '../src/oracle';
import { Validator } from "../src/types";
import { verifyValidator } from "../src/oracle/events/registers";

//disable logs
//console.log = function () {};
const STAKE_FEE = utils.parseEther("0.5");

describe("Registers users event listener", () => {
  let pk: string;
  let contract: Contract;
  let oracle: Oracle;
  let validatorAcc = "0x559f58A67C32223188a8bD0a16916D6f13Ad39dD";
  let indexes = [472327, 472328];

  before(async () => {
    oracle = await setup();
  });

  it("shouldn't let a user register unowned validators", async () => {
    // Tests based on prater state for simplicity
    const validators = [1];
    await verifyValidator(validatorAcc, validators, 0, oracle); 
    const result: any = await oracle.db.get(1);
    assert.equal(result, undefined);
  }).timeout(20000);

  it("should let a user register owned validators", async () => {
    // Tests based on prater state for simplicity
    const validators = indexes;
    await verifyValidator(validatorAcc, validators, 0, oracle); 

    const result1: any = await oracle.db.get(validators[0]);
    const result2: any = await oracle.db.get(validators[1]);
    assert.equal(result1.index, validators[0])
    assert.equal(result2.index, validators[1])
  }).timeout(20000);


  it("shouldn't allow a user to doble register a validator --> look for log", async () => {
    // Tests based on prater state for simplicity
    const validators = indexes;
    await verifyValidator(validatorAcc, validators, 0, oracle); 
  }).timeout(20000);

  it("shouldn't allow a user to register if deactivated --> look for log", async () => {
    // Tests based on prater state for simplicity
    const validators = indexes;
    const validator: any = await oracle.db.get(validators[0]);
    validator.deactivated = true;
    await oracle.db.insert(validators[0], validator);
    await verifyValidator(validatorAcc, validators, 0, oracle); 
  }).timeout(20000);

  it("should allow a user to register with previous exit --> look for log", async () => {
    // Tests based on prater state for simplicity
    const timestamp = 10000;
    const validators = indexes;
    const validator: any = await oracle.db.get(validators[1]);
    validator.active = false;
    await oracle.db.insert(validators[1], validator);
    await verifyValidator(validatorAcc, validators, timestamp, oracle); 
    const result1: any = await oracle.db.get(validators[1]);
    assert.equal(result1.active, true)
    assert.equal(result1.registrationTime, timestamp)
  }).timeout(20000);

  after(async () => {
    await oracle.db.delete(indexes[0])
    await oracle.db.delete(indexes[1])
    oracle.stop();
  })
});

