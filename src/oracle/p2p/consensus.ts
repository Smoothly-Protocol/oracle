import type { Vote } from './types';
import type { PeerId } from '@libp2p/interface-peer-id';

const VOTING_RATIO: number = 66;

export class Consensus {
  votes: {[epoch: number]: Vote[]};

  constructor() {
    this.votes = {};
  }

  addVote(from: PeerId, root: string, epoch: number): void {
    // Init
    if(!this.votes[epoch]) {
      this.votes[epoch] = [];
    }
    
    // Add data
    if(!this._exists(from, epoch)) {
      this.votes[epoch].push({
        id: from,
        root: root
      });
    }
  }

  // Find most agreeable root hash
  checkConsensus(epoch: number, index: number): any {
    try {
      let count: number = 0;
      let iterator: number = 0;
      let peers: PeerId[] = [];
      let root: string = '';

      if(this.votes[epoch]) {
        root = this.votes[epoch][index].root 
      } else {
        throw 'Warn: no votes provided to consensus';
      }

      for(let peer of this.votes[epoch]) {
        if(root === peer.root) {
          count ++;
          peers.push(peer.id);
        }  
        iterator++;
      }

      if(this._computeAgreements(count, epoch) >= VOTING_RATIO) {
        return { root: root, peers: peers, votes: this.votes[epoch]};
      } else if((iterator - 1) === index) {
        return { root: null, peers: peers, votes: this.votes[epoch]};
      }  

      return this.checkConsensus(epoch, index + 1);  
    } catch(err:any) {
      if(err == 'Warn: no votes provided to consensus') {
        return { root: undefined, peers: undefined, votes: undefined };
      } else {
        console.log(err);
      }
    }
  }

  reset(): void {
    //this.votes[epoch] = []; 
  }

  private _exists(peer: PeerId, epoch: number): boolean {
    let found = this.votes[epoch].find((p: any) => p.id.toString() === peer.toString());    
    return found ? true : false;
  }

  private _computeAgreements(count: number, epoch: number): number {
    return (count * 100) / this.votes[epoch].length;
  }
}
