import { assert } from "chai";
import { Oracle } from "../src/oracle";
import { processEpoch } from "../src/oracle/epoch";
import { setup, pks, time1Day } from "./setup";
import { Wallet, utils } from "ethers";
import { createFromPrivKey, createFromJSON } from '@libp2p/peer-id-factory'
import { keys } from '@libp2p/crypto';
import * as mh from 'multihashes';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { peerIdFromKeys, peerIdFromBytes } from '@libp2p/peer-id'
import * as Digest from 'multiformats/hashes/digest'

describe("Test utilities", () => {
  let oracle: Oracle; 

  before(async () => {
    oracle = await setup();
  });

  it("finds last Slot", async () => {
    const slot = await processEpoch(199929, true, oracle);
    assert.equal(slot.slot, "6397757");
  }).timeout(60000);

  it("generates peerId with linked to ethereum address", async () => {
    let wallet = Wallet.createRandom();
    let hash = utils.keccak256("0x" + wallet.publicKey.substring(4)).substring(26);
    console.warn(hash);
    let utf8 = Buffer.from(hash, 'hex');
    const multihash = Digest.encode(utf8, 'keccak-256')
    const peer = peerIdFromBytes(multihash);
    //console.warn(peer);
    /*
    let peer = await createFromJSON({
      id: peerIdFromBytes(multihash), 
      //privKey: wallet.privateKey.slice(2), 
      //pubKey: wallet.publicKey.slice(2)
    });
    let pair = keys.supportedKeys.secp256k1.unmarshalSecp256k1PublicKey(pk)
    console.warn(Buffer.from(await pair.hash()).toString('hex'));
    console.warn(hash);
    console.warn(wallet.address);*/
    //console.warn(Buffer.from(pair._key).toString('hex'));
    //let peerId = createFromPrivKey('Secp256k1', keypair); 
    //console.log(peerId);
  });

});
