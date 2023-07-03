import { assert } from "chai";
import { Consensus } from "../src/oracle/p2p/consensus";
import type { PeerId } from '@libp2p/interface-peer-id'
import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { peer1, peer2, peer3 } from './mock/peerIds';

//disable logs
//console.log = function () {};

describe("Consensus", () => {
	let consensus: Consensus;
  let p1: PeerId;
  let p2: PeerId;
  let p3: PeerId;

  beforeEach(async () => {
		consensus = new Consensus();;
		p1 = await createEd25519PeerId();	
		p2 = await createEd25519PeerId();	
		p3 = await createEd25519PeerId();	
  })

  it("no votes provided", async () => {
		const result = consensus.checkConsensus(0);
		assert.equal(result.root, undefined);
		assert.equal(result.peers, undefined);
		assert.equal(result.votes, undefined);
  });

  it("reaches consensus 3/3", async () => {
		let votes = [
			{ 
				id: p1,
				root: '0x47ba1f7160baa4f237ab22ecb59422bf3c0a8d528f819468badc6a70236227ea'
			},
			{ 
				id: p2,
				root: '0x47ba1f7160baa4f237ab22ecb59422bf3c0a8d528f819468badc6a70236227ea'
			},
			{ 
				id: p3,
				root: '0x47ba1f7160baa4f237ab22ecb59422bf3c0a8d528f819468badc6a70236227ea'
			}
		]

    await consensus.addVote(votes[0].id, votes[0].root); 
    await consensus.addVote(votes[1].id, votes[1].root); 
    await consensus.addVote(votes[2].id, votes[2].root); 

		const result = consensus.checkConsensus(0);
		assert.equal(result.root, votes[0].root);
		assert.equal(result.peers.length, 3);
		assert.equal(result.votes.length, 3);
  });

  it("reaches consensus 2/3", async () => {
		let votes = [
			{ 
				id: p1,
				root: '0xcb9a11d0a40ba4fb46764ce817739f9be8f72140b0def34d7addbbe238ffb3b2'
			},
			{ 
				id: p2,
				root: '0x47ba1f7160baa4f237ab22ecb59422bf3c0a8d528f819468badc6a70236227ea'
			},
			{ 
				id: p3,
				root: '0x47ba1f7160baa4f237ab22ecb59422bf3c0a8d528f819468badc6a70236227ea'
			}
		]

    await consensus.addVote(votes[0].id, votes[0].root); 
    await consensus.addVote(votes[1].id, votes[1].root); 
    await consensus.addVote(votes[2].id, votes[2].root); 

		const result = consensus.checkConsensus(0);
		assert.equal(result.root, votes[1].root);
		assert.equal(result.peers.length, 2);
		assert.equal(result.votes.length, 3);
  });

  it("doesn't reaches consensus 1/3", async () => {
		let votes = [
			{ 
				id: p1,
				root: '0xcb9a11d0a40ba4fb46764ce817739f9be8f72140b0def34d7addbbe238ffb3b2'
			},
			{ 
				id: p2,
				root: '0x47ba1f7160baa4f237ab22ecb59422bf3c0a8d528f819468badc6a70236227ea'
			},
			{ 
				id: p3,
				root: '0x57ba1f7160baa4f237ab22ecb59422bf3c0a8d528f819468badc6a70236227ea'
			}
		]

    await consensus.addVote(votes[0].id, votes[0].root); 
    await consensus.addVote(votes[1].id, votes[1].root); 
    await consensus.addVote(votes[2].id, votes[2].root); 

		const result = consensus.checkConsensus(0);
		assert.equal(result.root, null);
		assert.equal(result.peers.length, 1);
		assert.equal(result.votes.length, 3);
  });

  it("avoids repeated peer", async () => {
		let votes = [
			{ 
				id: p1,
				root: '0xcb9a11d0a40ba4fb46764ce817739f9be8f72140b0def34d7addbbe238ffb3b2'
			},
			{ 
				id: p1,
				root: '0x47ba1f7160baa4f237ab22ecb59422bf3c0a8d528f819468badc6a70236227ea'
			},
			{ 
				id: p3,
				root: '0x57ba1f7160baa4f237ab22ecb59422bf3c0a8d528f819468badc6a70236227ea'
			}
		]

    await consensus.addVote(votes[0].id, votes[0].root); 
    await consensus.addVote(votes[1].id, votes[1].root); 
    await consensus.addVote(votes[2].id, votes[2].root); 

		const result = consensus.checkConsensus(0);
		assert.equal(result.root, null);
		assert.equal(result.peers.length, 1);
		assert.equal(result.votes.length, 2);
  });
});
