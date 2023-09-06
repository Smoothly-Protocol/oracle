import { assert } from "chai";
import { Oracle } from "../src/oracle";
import { processEpoch } from "../src/oracle/epoch";
import { setup, pks, time1Day } from "./setup";

describe("Test utilities", () => {
  let oracle: Oracle; 

  before(async () => {
    oracle = await setup();
  });

  it("finds last Slot", async () => {
    const slot = await processEpoch(199929, true, oracle);
    assert.equal(slot.slot, "6397757");
  }).timeout(60000);

});
