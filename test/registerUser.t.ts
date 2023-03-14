import { assert, expect } from "chai";
import { providers, Contract, Wallet, utils } from "ethers";
import { setup } from "./setup";
import { delay, decodeUser } from "./utils";
import { STAKE_FEE } from "../src/utils";
import { Config } from '../src/config';
import { User } from "../src/types";

import { startRegistrationListener } from "../src/listeners";

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load Environment variables
dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

describe("Registers users correctly on event listener", () => {
  let pk: string;
  let contract: Contract;
  let config: Config;
  let validatorAcc: Wallet;

  if(process.env.ACC_WITH_VALIDATORS != undefined) {
    pk = process.env.ACC_WITH_VALIDATORS;
  } else {
    throw new Error("Setup ACC_WITH_VALIDATORS in .env");
  }

  before(async () => {
    config = await setup();
    validatorAcc = new Wallet(pk, config.contract.provider);
    contract = config.contract.connect(config.signer);
    await config.signer.sendTransaction({
      value: utils.parseEther("10.0"),
      to: validatorAcc.address
    });
    startRegistrationListener(config);
  });

  it("shouldn't let a user register unowned validators", async () => {
    // Tests based on prater state for simplicity
    const validators = [1];
    await contract.registerBulk(
      validators, 
      {value: utils.parseEther("0.65")}
    );
    await delay(5000);
    const result = await config.getDB(config.signer.address);
    assert.equal(result, undefined);
  }).timeout(20000);

  it("should let a user register owned validators", async () => {
    // Tests based on prater state for simplicity
    const validators = [398069, 398070];
    await contract.connect(validatorAcc).registerBulk(
      validators, 
      {value: utils.parseEther("1.30")}
    );
    // Wait for event listeners to get picked up
    await delay(8000);
    const result = await config.getDB(validatorAcc.address);
    const expected: User[] = [
      [validators[0], 0, 0, 0, STAKE_FEE, 0, 0],
      [validators[1], 0, 0, 0, STAKE_FEE, 0, 0]
    ];

    const final: User[] = decodeUser(result);
    expect(final.sort()).to.eql(expected.sort());
  }).timeout(20000);

  after(() => {
    process.exit(0);
  });
});

