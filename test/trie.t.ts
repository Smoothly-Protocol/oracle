import { assert, expect } from "chai";
import { DB } from '../src/db';
import { Validator } from "../src/types";
import { validators } from "./mock";
import { EMPTY_ROOT } from '../src/utils';

describe("DB Merkle Trie", () => {
  let db: DB;

  before(() => {
    db = new DB(EMPTY_ROOT, true); 
  });
  
  it("detects previous root hash", async () => {
    await db.insert(0, validators[0]);
    const root1 = db.root().toString('hex');
    await db.insert(1, validators[1]);
    const root2 = db.root().toString('hex');
    assert.equal(root1 === root2, false);
    assert.equal(await db.hasRoot(`0x${root1}`), true);
  })
});
