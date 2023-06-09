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

export class Node {
  bootstrapers: string[];
  peers: Peer[];
  node!: Libp2p;
  db: DB;

  constructor(_bootstrapers: string[], _db: DB) {
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
          this.peers.push({
            address: addresses[0].multiaddr,
            id: id
          });
        }

        console.log("Discovered:", id.toString());
      })

      // Handle pubsub messages
      node.services.pubsub.addEventListener('message', (evt) => {
        if(evt.detail.topic === `${node.peerId.toString()}`) {
          const data = Buffer.from(evt.detail.data).toString();
          if(data === 'sync') {
            const { from } = evt.detail as any;
            const peer = this._findPeer(from);
            if(peer) {
              this.dialPeerSync(peer.address);
            }
          }
        } else if(evt.detail.topic === 'checkpoint'){
          const root = Buffer.from(evt.detail.data).toString();
          // TODO: Compare root with peers 
        }
      })

      // Handle stream muxing from peer:sync 
      node.handle('/sync:peer', async ({ stream }) => {
        let db: DB = this.db;
        pipe(
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

            console.log('Synced from peer to:', db.root().toString('hex'));
          }
        )
      })

      await node.start();
      this.node = node;
    } catch(err: any) {
      console.log(err);
    }
  }

  async requestSync() {
    try {
      await this._waitForPeers();
      const node: any = this.node;

      const peer = this._getRandomPeer();
      const peerId = peer.id.toString();

      await node.services.pubsub.publish(
        peerId, 
        uint8ArrayFromString('sync'),
      );
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
      if(p.id === peer) {
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

