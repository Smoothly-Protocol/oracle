import { assert } from "chai";
import { Consensus } from "../src/oracle/p2p/consensus";
import type { PeerId } from '@libp2p/interface-peer-id'
import { createFromJSON } from '@libp2p/peer-id-factory';
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
		p1 = await createFromJSON(peer1);	
		p2 = await createFromJSON(peer2);	
		p3 = await createFromJSON(peer3);	
  })

  it("adds votes", async () => {
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

		for(let vote of votes) {
			await consensus.addVote(vote.id, vote.root); 
		}

		const result = consensus.checkConsensus(votes[0].root, 0);
		assert.equal(result.root, votes[0].root);
		assert.equal(result.peers.length, 3);
		assert.equal(result.votes.length, 3);
  });

});
