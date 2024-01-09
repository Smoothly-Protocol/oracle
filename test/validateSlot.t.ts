import { assert } from "chai";
import { setup } from "./setup";
import { BigNumber, providers, Contract, Wallet, utils } from "ethers";
import { Oracle } from '../src/oracle';
import { Validator } from "../src/types";
import { validators } from "./mock";
import { validateSlot , reqSlotInfo } from "../src/oracle/epoch";
import { STAKE_FEE, EMPTY_ROOT } from "../src/utils";
import { DB } from "../src/db";

describe("Validate Slots", () => {
  let contract: Contract;
  let validator: Validator = validators[0];
  let db: DB;

  before(async () => {
    // Dapp node mainnet pool simulation
    // there's a new PBS method that happened in their pool
    const provider = new providers.JsonRpcProvider('https://eth-mainnet.alchemyapi.io/v2/zmsxPR7pKHtiLvAkZ1R61BYtCqnCg0yc');
    contract = new Contract(
      '0xAdFb8D27671F14f297eE94135e266aAFf8752e35',
      [],
      provider
    );
    db = new DB(EMPTY_ROOT, true);
    await db.insert(
      validator.index,
      validator 
    );
  });

  it("finds pool address in tx data", () => {
    const data = "0x000000000adc0aa8ebb6ad5a8e499e550ae2c461197624c6e6670ab0950b6c0000000000000071ab91a2543f9700adfb8d27671f14f297ee94135e266aaff8752e35";
    const pool: string = contract.address.toLowerCase().slice(2);
    assert.equal(data.toLowerCase().includes(pool), true);
  });

  it("should pick up block build through new PBS method", async () => {
    let { body } = await reqSlotInfo(
      8097330, 
      'http://unstable.mainnet.beacon-api.nimbus.team'
    );
    await validateSlot(validator, body, contract, db);
    let v = await db.get(validator.index) as Validator;
    assert.equal(v.slashFee, 0)
  }).timeout(20000);

  it("should pick up block build through builder", async () => {
    let { body } = await reqSlotInfo(
      8163951, 
      'http://unstable.mainnet.beacon-api.nimbus.team'
    );
    await validateSlot(validator, body, contract, db);
    let v = await db.get(validator.index) as Validator;
    assert.equal(v.slashFee, 0)
  }).timeout(20000);

  it("should pick up block with raw fee_recipient", async () => {
    let { body } = await reqSlotInfo(
      8143001, 
      'http://unstable.mainnet.beacon-api.nimbus.team'
    );
    await validateSlot(validator, body, contract, db);
    let v = await db.get(validator.index) as Validator;
    assert.equal(v.slashFee, 0)
  }).timeout(20000);

  it("should pick up with incorrect fee_recipient", async () => {
    let { body } = await reqSlotInfo(
      8164781, 
      'http://unstable.mainnet.beacon-api.nimbus.team'
    );
    await validateSlot(validator, body, contract, db);
    let v = await db.get(validator.index) as Validator;
    assert.equal(v.slashFee, 1)
  }).timeout(20000);
});
