import { createLibp2p } from 'libp2p';
import { yamux } from '@chainsafe/libp2p-yamux'
import { keys } from '@libp2p/crypto';
import { noise } from '@chainsafe/libp2p-noise'
import { bootstrap } from '@libp2p/bootstrap'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { floodsub } from "@libp2p/floodsub"
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'
import { circuitRelayTransport } from 'libp2p/circuit-relay'
import { kadDHT } from '@libp2p/kad-dht'
import { identifyService } from 'libp2p/identify'
import { webSockets } from '@libp2p/websockets'
import { tcp } from '@libp2p/tcp'
import { uPnPNATService } from 'libp2p/upnp-nat'
import { mdns } from '@libp2p/mdns'
import { multiaddr, Multiaddr } from '@multiformats/multiaddr'
import { createFromPrivKey } from '@libp2p/peer-id-factory'
import { pipe } from 'it-pipe'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
//import type { Peer } from './types';
import { Peer } from "@libp2p/interface/peer-store/index";
import type { PeerId } from '@libp2p/interface-peer-id'
import type { Libp2p } from 'libp2p';
import { setTimeout } from "timers/promises";
import { Validator } from '../../types';
import { DB } from "../../db";
import { Consensus } from "./consensus";
import { pushable } from 'it-pushable';

export class Node {
  bootstrapers: string[];
  node!: Libp2p;
  db: DB;
  consensus: Consensus;
  httpPort: number;
  keyPair: any;
  nat: boolean;
  p2pPort: string;
  announceIp!: string;
  announceDns!: string;
  DHTServer: boolean;

  constructor(
    _bootstrapers: string[], 
    _db: DB, 
    _httpPort: number, 
    _pk: string,
    _nat: boolean,
    _announceIp: string,
    _announceDns: string,
    _p2pPort: string,
    _dhtServer: boolean
  ) {
    this.consensus = new Consensus();
    this.bootstrapers = _bootstrapers;
    this.httpPort = _httpPort;
    this.keyPair = this._generatePair(_pk);
    this.db = _db;
    this.nat = _nat;
    this.p2pPort = _p2pPort;
    this.announceIp = _announceIp;
    this.announceDns = _announceDns;
    this.DHTServer = _dhtServer;
  }

  async createNode(): Promise<void> {
    try {
      const a = {
          listen: [`/ip4/127.0.0.1/tcp/${this.p2pPort}/ws`],
          announce: [`/dns4/${this.announceDns}/tcp/443/wss/`]
      }
      const b = {
            listen: [`/ip4/0.0.0.0/tcp/${this.p2pPort}/ws`],
      }

      let config = {
        peerId: await createFromPrivKey(this.keyPair),
        addresses: this.announceDns ? a : b,
        transports: [
          webSockets()
        ],
        streamMuxers: [
          yamux({
            maxMessageSize: 1 << 20
          })
        ],
        connectionEncryption: [
          noise()
        ],
        connectionManager: {
          minConnections: 1
        },
        services: {
          pubsub: gossipsub({ allowPublishToZeroPeers: true }),
          identify: identifyService({ runOnConnectionOpen: false }),
          dht: kadDHT({ clientMode: !this.DHTServer }),
          nat: uPnPNATService({
            //description: 'my-node', // set as the port mapping description on the router, defaults the current libp2p version and your peer id
            //gateway: '192.168.1.1', // leave unset to auto-discover
            externalAddress: this.announceIp, // leave unset to auto-discover
            //localAddress: '129.168.1.123', // leave unset to auto-discover
            ttl: 7200, // TTL for port mappings (min 20 minutes)
            keepAlive: true, // Refresh port mapping after TTL expires
          })    
        },
          peerDiscovery: [
            bootstrap({
              list: this.bootstrapers
            }),
          ],
      };

      const node = await createLibp2p(config);

      if(!this.nat) {
        await node.services.nat.stop();
      }

      // Personal_id channel
      node.services.pubsub.subscribe(`${node.peerId.toString()}`)
      // Checkpoint check
      node.services.pubsub.subscribe('checkpoint')
      // Log established peer connections
      node.addEventListener('peer:connect', async (evt) => {
        console.log(
          "Established connection with peer:", 
          evt.detail.toString(), 
          "Total peers:", (await node.peerStore.all()).length
        );
        const conn = await node.dial(evt.detail)
        await node.services.identify.identify(conn);
      })
      // Establish connections on peer discovery 
      node.addEventListener('peer:discovery', async (evt) => {
        if(evt.detail.multiaddrs.length > 0) {
          console.log(
            "Discovered:",
            evt.detail.id.toString(),
            "Total peers:", (await node.peerStore.all()).length
          );
        }
      })
      // Manually delete peer to restore pubsub on restart 
      node.addEventListener('peer:disconnect', async (evt) => {
        await node.peerStore.delete(evt.detail);
      })

      // Handle pubsub messages
      node.services.pubsub.addEventListener('message', (evt) => {
        const { from } = evt.detail as any;
        if(evt.detail.topic === `${node.peerId.toString()}`) {
          const data = Buffer.from(evt.detail.data).toString();
          if(data === 'sync') {
            console.log(`Received sync request from: ${from}`);
            this.dialPeerSync(from);
          }
        } else if(evt.detail.topic === 'checkpoint'){
          console.log(evt.detail);
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

      await setTimeout(10000);

      node.getMultiaddrs().forEach((ma) => {
        console.log('P2P listening on:', ma.toString())
      })

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
        : await this._getRandomPeer();

        console.log(`Requesting sync to: ${peerId.toString()}`)

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

      await this._waitForVotes(epoch);

      const obj = this.consensus.checkConsensus(epoch, 0);
      this.consensus.delete(epoch);
      return obj;
    } catch(err: any) {
      console.log(err);
    }
  }

  // Dials Peer requesting syncing
  async dialPeerSync(peer: PeerId) {
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

  private _generatePair(_pk: string): any {
    const pk = Uint8Array.from(Buffer.from(_pk, 'hex'));
    return keys.supportedKeys.secp256k1.unmarshalSecp256k1PrivateKey(pk)
  }

  private async _getRandomPeer(): Promise<PeerId> {
    const peers = await this.node.peerStore.all();
    const rando = Math.floor(Math.random() * peers.length);
    return peers[rando].id;
  }

  private async _waitForVotes(epoch: number): Promise<void> {
    const maxTimeout = 240000;
    let count = 0;
    const peers = await this.node.peerStore.all();

    if(peers.length === 0) {
      try {
        await this.node.dial(multiaddr(this.bootstrapers[0]));
      } catch {
        console.log("Warning: Bootsraper node not reachable");
      }
    }

    while(this.consensus.votes[epoch].length < (peers.length + 1) && count < maxTimeout) {
      await setTimeout(10000);
      count += 10000;
    } 
  }

  private async _waitForPeers(): Promise<void> {
    const maxTimeout = 30000;
    let count = 0;

    console.log("Waiting for peers...");

    const peers = await this.node.peerStore.all();
    while(peers.length === 0 && count < maxTimeout) {
      await setTimeout(10000);
      count+=10000;
    } 

    if(maxTimeout === count) {
      throw "No peers found to sync from";
    }
  }
}

