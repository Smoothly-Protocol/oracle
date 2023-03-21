import { assert, expect } from "chai";
import { providers, Contract, Wallet, utils } from "ethers";
import { setup } from "./setup";
import { delay } from "./utils";
import { STAKE_FEE } from "../src/utils";
import { Oracle } from '../src/oracle';
import { Validator } from "../src/types";

import * as dotenv from 'dotenv';
import * as path from 'path';

//disable logs
console.log = function () {};

// Load Environment variables
dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

describe("Registers users event listener", () => {
  let pk: string;
  let contract: Contract;
  let oracle: Oracle;
  let validatorAcc: Wallet;
  let indexes: number[];

  if(
    (process.env.ACC_WITH_VALIDATORS != undefined) && 
    (process.env.VALIDATOR_INDEXES != undefined)
  ) {
    pk = process.env.ACC_WITH_VALIDATORS;
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
		oracle.start()
  });

  it("shouldn't let a user register unowned validators", async () => {
    // Tests based on prater state for simplicity
    const validators = [1];
    await contract.registerBulk(
      validators, 
      {value: utils.parseEther("0.65")}
    );
    await delay(5000);
    const result: any = await oracle.db.get(1);
    assert.equal(result, undefined);
  }).timeout(20000);

  it("shouldn't allow a user to doble register a validator", async () => {

  });

  it("should let a user register owned validators", async () => {
    // Tests based on prater state for simplicity
    const validators = indexes;
    await contract.connect(validatorAcc).registerBulk(
      validators, 
      {value: utils.parseEther("1.30")}
    );
    // Wait for event listeners to get picked up
    await delay(8000);
    const result1: any = await oracle.db.get(validators[0]);
    const result2: any = await oracle.db.get(validators[1]);

    assert.equal(result1.index, validators[0])
    assert.equal(result2.index, validators[1])
  }).timeout(20000);

  after(async () => {
    await oracle.db.delete(indexes[0])
    await oracle.db.delete(indexes[1])
    oracle.stop();
  })
});

