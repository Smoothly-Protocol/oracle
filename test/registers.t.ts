import { assert, expect } from "chai";
import { providers, Contract, Wallet, utils } from "ethers";
import { setup } from "./setup";
import { delay } from "./utils";
import { Oracle } from '../src/oracle';
import { Validator } from "../src/types";
import { Registered, verifyValidator } from "../src/oracle/events/registers";
import { homedir } from 'os';

import * as dotenv from 'dotenv';
import * as path from 'path';

//disable logs
//console.log = function () {};
const STAKE_FEE = utils.parseEther("0.5");

// Load Environment variables
dotenv.config({
  path: path.resolve('.env')
});

describe("Registers users event listener", () => {
  let pk: string;
  let contract: Contract;
  let oracle: Oracle;
  let validatorAcc: Wallet;
  let indexes: number[];

  if(
    (process.env.PRIVATE_KEY_WITHDRAWAL != undefined) && 
    (process.env.VALIDATOR_INDEXES != undefined)
  ) {
    pk = process.env.PRIVATE_KEY_WITHDRAWAL;
    indexes = JSON.parse(process.env.VALIDATOR_INDEXES)
      .map((e: string) => {return Number (e)});
  } else {
    throw new Error("Setup ACC_WITH_VALIDATORS and VALIDATOR_INDEXES in .env");
  }

  before(async () => {
    oracle = await setup();
    validatorAcc = new Wallet(pk, oracle.contract.provider);
    contract = oracle.contract.connect(oracle.signer);
    await oracle.signer.sendTransaction({
      value: utils.parseEther("10.0"),
      to: validatorAcc.address
    });
    Registered(oracle);
  });

  it("shouldn't let a user register unowned validators", async () => {
    // Tests based on prater state for simplicity
    const validators = [1];
    await contract.registerBulk(
      validators, 
      {value: STAKE_FEE}
    );
    await delay(5000);
    const result: any = await oracle.db.get(1);
    assert.equal(result, undefined);
  }).timeout(20000);

  it("should let a user register owned validators", async () => {
    // Tests based on prater state for simplicity
    const validators = indexes;
    await contract.connect(validatorAcc).registerBulk(
      validators, 
      {value: STAKE_FEE.mul(2)}
    );
    // Wait for event listeners to get picked up
    await delay(8000);
    const result1: any = await oracle.db.get(validators[0]);
    const result2: any = await oracle.db.get(validators[1]);

    assert.equal(result1.index, validators[0])
    assert.equal(result2.index, validators[1])
  }).timeout(20000);


  it("shouldn't allow a user to doble register a validator --> look for log", async () => {
    // Tests based on prater state for simplicity
    const validators = indexes;
    await contract.connect(validatorAcc).registerBulk(
      validators, 
      {value: STAKE_FEE.mul(2)}
    );
    // Wait for event listeners to get picked up
    await delay(5000);
  }).timeout(20000);

  it("shouldn't allow a user to register if deactivated --> look for log", async () => {
    // Tests based on prater state for simplicity
    const validators = indexes;
    const validator: any = await oracle.db.get(validators[0]);
    validator.deactivated = true;
    await oracle.db.insert(validators[0], validator);
    await contract.connect(validatorAcc).registerBulk(
      validators, 
      {value: STAKE_FEE.mul(2)}
    );
    // Wait for event listeners to get picked up
    await delay(5000);
  }).timeout(20000);

  it("should allow a user to register with previous exit --> look for log", async () => {
    // Tests based on prater state for simplicity
    const validators = indexes;
    const validator: any = await oracle.db.get(validators[1]);
    validator.active = false;
    await oracle.db.insert(validators[1], validator);
    await contract.connect(validatorAcc).registerBulk(
      validators, 
      {value: STAKE_FEE.mul(2)}
    );
    // Wait for event listeners to get picked up
    await delay(5000);
    const result1: any = await oracle.db.get(validators[1]);

    assert.equal(result1.active, true)
  }).timeout(20000);

  after(async () => {
    await oracle.db.delete(indexes[0])
    await oracle.db.delete(indexes[1])
    oracle.stop();
  })
});

