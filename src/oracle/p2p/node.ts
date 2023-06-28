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

export class Node {
  bootstrapers: string[];
  peers: Peer[];
  node!: Libp2p;
  db: DB;
  consensus: Consensus;

  constructor(_bootstrapers: string[], _db: DB) {
    this.consensus = new Consensus();
    this.bootstrapers = _bootstrapers;
    this.peers = [];
    this.db = _db;
  }

  async createNode(): Promise<void> {
    try {
      const node = await createLibp2p({
        transports: [
          webSockets(),
          circuitRelayTransport({
            discoverRelays: 2
          })
        ],
        streamMuxers: [
          yamux(),mplex()
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
          const root = Buffer.from(evt.detail.data).toString();
          console.log('checkpoint:',from, root);
          this.consensus.addVote(from, root);
        }
      })

      // Handle stream muxing from peer:sync 
      node.handle('/sync:peer', async ({ stream }) => {
        let db: DB = this.db;
        await pipe(
          stream,
          async function (source) {
            // Concatenate stream
            let str: string = '';
            for await (const msg of source) {
              str += uint8ArrayToString(msg.subarray())
            }

            // Add data to db
            for(let validator of JSON.parse(str).data) {
              await db.insert(validator.index, validator);
            }
          }
        )
        console.log('Synced from peer to:', db.root().toString('hex'));
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

  async startConsensus(_root: string): Promise<any> {
    try {
      const node: any = this.node;
      this.consensus.addVote(node.peerId, _root);

      await node.services.pubsub.publish(
        'checkpoint',
        uint8ArrayFromString(_root),
      );

      await setTimeout(240000);
      
      const result = this.consensus.checkConsensus(0);
      this.consensus.reset();
      return result;
    } catch(err: any) {
      console.log(err);
    }
  }

  // Dials Peer requesting syncing
  async dialPeerSync(peer: Multiaddr) {
      const req = await fetch('http://localhost:4040/checkpoint');
      const res = await req.json();
      const stream = await this.node.dialProtocol(peer, ['/sync:peer'])
      await pipe(
        [uint8ArrayFromString(JSON.stringify(res))],
        stream
      )
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

  private async _waitForPeers(): Promise<void> {
    console.log("Waiting for peers...");
    while(this.peers.length === 0) {
      await setTimeout(10000);
    } 
  }
}

