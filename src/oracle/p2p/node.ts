import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { yamux } from '@chainsafe/libp2p-yamux'
import { noise } from '@chainsafe/libp2p-noise'
import { floodsub } from '@libp2p/floodsub'
import { bootstrap } from '@libp2p/bootstrap'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'
import { circuitRelayTransport } from 'libp2p/circuit-relay'
import { identifyService } from 'libp2p/identify'
import { webSockets } from '@libp2p/websockets'
import { multiaddr, Multiaddr } from '@multiformats/multiaddr'
import { pipe } from 'it-pipe'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import type { Peer } from './types';
import type { PeerId } from '@libp2p/interface-peer-id'
import type { Libp2p } from 'libp2p';
import { setTimeout } from "timers/promises";
import { Validator } from '../../types';
import { DB } from "../../db";
import { Consensus } from "./consensus";
import { pushable } from 'it-pushable';

export class Node {
  bootstrapers: string[];
  peers: Peer[];
  node!: Libp2p;
  db: DB;
  consensus: Consensus;
  httpPort: number;

  constructor(_bootstrapers: string[], _db: DB, _httpPort: number) {
    this.consensus = new Consensus();
    this.bootstrapers = _bootstrapers;
    this.peers = [];
    this.db = _db;
    this.httpPort = _httpPort;
  }

  async createNode(): Promise<void> {
    try {
      const node = await createLibp2p({
        transports: [
          webSockets(),
          circuitRelayTransport({
            discoverRelays: 1
          })
        ],
        streamMuxers: [
          yamux({
            maxMessageSize: 1 << 20
          })
        ],
        connectionEncryption: [
          noise()
        ],
        services: {
          pubsub: floodsub(),
          identify: identifyService()
        },
        peerDiscovery: [
          bootstrap({
            list: this.bootstrapers
          }),
          pubsubPeerDiscovery({
            interval: 1000,
          })
        ],
      });

      // Personal_id channel
      node.services.pubsub.subscribe(`${node.peerId.toString()}`)
      // Checkpoint check
      node.services.pubsub.subscribe('checkpoint')

      // Track peers
      node.addEventListener('peer:discovery', async (evt) => {
        const { addresses, id } = evt.detail as any;

        // Avoids relay nodes
        if(addresses.length > 0) {
          const peer: Peer = {
            address: addresses[0].multiaddr,
            id: id
          };

          // Exists peer?
          if(this._findPeer(peer.id) === null) {
            this.peers.push(peer);
            console.log("Discovered Peer:", id.toString(), "total:", this.peers.length);
          }
        }
      })

      // Handle pubsub messages
      node.services.pubsub.addEventListener('message', (evt) => {
        const { from } = evt.detail as any;
        if(evt.detail.topic === `${node.peerId.toString()}`) {
          const data = Buffer.from(evt.detail.data).toString();
          if(data === 'sync') {
            const peer = this._findPeer(from);
            if(peer) {
              this.dialPeerSync(peer.address);
            }
          }
        } else if(evt.detail.topic === 'checkpoint'){
          const { root, epoch } = JSON.parse(uint8ArrayToString(evt.detail.data));
          console.log('checkpoint:', from, root, epoch);
          this.consensus.addVote(from, root, epoch);
        }
      })

      // Handle stream muxing from peer:sync 
      node.handle('/sync:peer', async ({ stream }) => {
        let db: DB = this.db;
        await pipe(
          stream,
          async function (source) {
            // Add data
            for await (const msg of source) {
              let validator = JSON.parse(uint8ArrayToString(msg.subarray()));
              await db.insert(validator.index, validator);
            }
          }
        )
        stream.close();
      })

      await node.start();
      this.node = node;
    } catch(err: any) {
      console.log(err);
    }
  }

  async requestSync(peers?: PeerId[]) {
    try {
      await this._waitForPeers();
      const node: any = this.node;

      const peerId = peers
        ? peers[Math.floor(Math.random() * peers.length)] 
        : this._getRandomPeer().id;

        await node.services.pubsub.publish(
          peerId.toString(), 
          uint8ArrayFromString('sync'),
        );
    } catch(err: any) {
      console.log(err);
    }
  }

  async startConsensus(_root: string, epoch: number): Promise<any> {
    try {
      const node: any = this.node;
      this.consensus.addVote(node.peerId, _root, epoch);

      await node.services.pubsub.publish(
        'checkpoint',
        uint8ArrayFromString(JSON.stringify({
          root: _root,
          epoch: epoch
        })),
      );

      await this._waitForVotes(epoch);;

      const obj = this.consensus.checkConsensus(epoch, 0);
      this.consensus.delete(epoch);
      return obj;
    } catch(err: any) {
      console.log(err);
    }
  }

  // Dials Peer requesting syncing
  async dialPeerSync(peer: Multiaddr) {
    try {
      const req = await fetch(`http://localhost:${this.httpPort}/checkpoint`);
      const res = await req.json();

      // Send data
      const stream = await this.node.dialProtocol(peer, ['/sync:peer'])
      await pipe(
        res.data.map((v: any) => {return uint8ArrayFromString(JSON.stringify(v))}),
        stream
      )

      // Graceful close
      stream.close()
    } catch(err: any) {
      console.log(err);
    }
  }

  private _getRandomPeer(): Peer {
    const rando = Math.floor(Math.random() * this.peers.length);
    return this.peers[rando];
  }

  private _findPeer(peer: PeerId): Peer | null {
    for(let p of this.peers) {
      if(p.id.toString() === peer.toString()) {
        return p;
      }
    }
    return null;
  }

  private async _waitForVotes(epoch: number): Promise<void> {
    const maxTimeout = 240000;
    let count = 0;
    while(this.consensus.votes[epoch].length < 4 || count >= maxTimeout) {
      await setTimeout(10000);
      count += 10000;
    } 
  }

  private async _waitForPeers(): Promise<void> {
    console.log("Waiting for peers...");
    while(this.peers.length === 0) {
      await setTimeout(10000);
    } 
  }
}

