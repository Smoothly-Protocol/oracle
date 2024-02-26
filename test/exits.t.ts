import { assert } from "chai";
import { Trie } from '@ethereumjs/trie';
import { setup } from "./setup";
import { getProof, delay } from "./utils";
import { BigNumber, providers, Contract, Wallet, utils } from "ethers";
import { Oracle } from '../src/oracle';
import { STAKE_FEE } from "../src/utils";
import { Validator } from "../src/types";
import { ExitRequested } from "../src/oracle/events/exits";

//disable logs
//console.log = function () {};

describe("Exits", () => {
  let oracle: Oracle;
  let contract: Contract;
  let indexes: number[] = [38950];

  before(async () => {
    oracle = await setup();      
    contract = oracle.contract.connect(oracle.signer);
    // Send eth to contract for exits withdrawals 
    await oracle.signer.sendTransaction({
      value: utils.parseEther("5.0"),
      to: contract.address
    });
    // Hardcode user to db
    const newUser: Validator = {
      index: indexes[0], 
      eth1: oracle.signer.address.toLowerCase(),
      rewards: BigNumber.from("0"),
      slashMiss: 0,
      slashFee: 0, 
      stake: STAKE_FEE,
      registrationTime: 0,
      firstBlockProposed: false, 
      firstMissedSlot: false,
      exitRequested: false,
      active: true,
      deactivated: false
    };
    await oracle.db.insert(
      indexes[0],
      newUser 
    );
    ExitRequested(oracle);
  })

  it("picks up and validates exit of validator from contract", async () => {
    await contract.requestExit(indexes); 
    await delay(5000);
    const result: any = await oracle.db.get(indexes[0])
    assert.equal(result.exitRequested, true);
  }).timeout(20000);

  after(async () => {
    await oracle.db.delete(indexes[0])
    oracle.stop();
  });
});
