import type { Votes } from './types';
import type { PeerId } from '@libp2p/interface-peer-id'

const VOTING_RATIO: number = 66;

export class Consensus {
  votes: Votes[];

  constructor() {
    this.votes = [];
  }

  addVote(from: PeerId, root: string): void {
    if(!this._exists(from)) {
      this.votes.push({
        id: from,
        root: root
      });
    }
  }

  // Find most agreeable root hash
  checkConsensus(index: number): any {
    let count: number = 0;
    let iterator: number = 0;
    let root: string = this.votes[index].root;
    let peers: PeerId[] = [];

    for(let peer of this.votes) {
      if(root === peer.root) {
        count ++;
        peers.push(peer.id);
      }  
      iterator++;
    }

    if(this._computeAgreements(count) >= VOTING_RATIO) {
      return { root: root, peers: peers, votes: this.votes};
    } else if((iterator - 1) === index) {
      return { root: null, peers: peers, votes: this.votes};
    }  

    return this.checkConsensus(index + 1);  
  }

  reset(from: PeerId, root: string): void {
    this.votes = [];
    this.addVote(from, root);
  }

  private _exists(peer: PeerId): boolean {
    let found = this.votes.find((p: any) => p.id === peer);    
    return found ? true : false;
  }

  private _computeAgreements(count: number): number {
    return (count * 100) / this.votes.length;
  }
}
