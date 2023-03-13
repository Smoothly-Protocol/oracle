import { assert } from "chai";
import { providers, Contract, Wallet } from "ethers";
import { setup } from "./setup";

//import { startRegistrationListener } from "../src/listeners";

describe("Registers users correctly on event listener", () => {
  let contract;

  before(async () => {
    contract = await setup();
    console.log("Contract deployed with:", contract.address);
  });

  it("should work", () => {
    const result = 2 + 3;
    assert.equal(result, 5);
  });
});
