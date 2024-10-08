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
import { peerIdFromString } from '@libp2p/peer-id'
import { pipe } from 'it-pipe'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { Peers } from '../../config';
import { Peer } from "@libp2p/interface/peer-store/index";
import type { PeerId } from '@libp2p/interface-peer-id'
import type { Libp2p } from 'libp2p';
import type { libp2pAddresses } from './types';
import { setTimeout } from "timers/promises";
import { Validator } from '../../types';
import { DB } from "../../db";
import { Consensus } from "./consensus";
import { pushable } from 'it-pushable';
import { logger } from '../../utils';

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
      const addresses: libp2pAddresses = {
        listen: [`/ip4/0.0.0.0/tcp/${this.p2pPort}/ws`],
      };

      if(this.announceDns) {
        addresses.listen = [`/ip4/127.0.0.1/tcp/${this.p2pPort}/ws`],
        addresses.announce = [`/dns4/${this.announceDns}/tcp/443/wss/`]
      } else if(this.announceIp) {
        addresses.listen = [`/ip4/0.0.0.0/tcp/${this.p2pPort}/ws`],
        addresses.announce = [`/ip4/${this.announceIp}/tcp/${this.p2pPort}/ws`]
      }

      let config = {
        peerId: await createFromPrivKey(this.keyPair),
        addresses: addresses,
        transports: [
          webSockets(),
          tcp(),
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
          minConnections: 6
        },
        connectionGater: {
          denyOutboundConnection: (peerId: PeerId, maConn: any) => {
            return !Peers.includes(peerId.toString());
          },
          denyInboundEncryptedConnection: (peerId: PeerId, maConn: any) => {
            return !Peers.includes(peerId.toString());
          }
        },
        services: {
          pubsub: gossipsub({ allowPublishToZeroPeers: true }),
          identify: identifyService({ runOnConnectionOpen: false }),
          dht: kadDHT({ clientMode: !this.DHTServer }),
          nat: uPnPNATService({
            //description: 'my-node', // set as the port mapping description on the router, defaults the current libp2p version and your peer id
            //gateway: '192.168.1.1', // leave unset to auto-discover
            //externalAddress: this.announceIp, // leave unset to auto-discover
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

      // Personal_id channel
      node.services.pubsub.subscribe(`${node.peerId.toString()}`)
      // Checkpoint check
      node.services.pubsub.subscribe('checkpoint')

      // Log established peer connections
      node.addEventListener('peer:connect', async (evt) => {
        logger.info(`Established connection - peer=${evt.detail.toString()} total=${(await node.peerStore.all()).length}`);
        const conn = await node.dial(evt.detail)
        await node.services.identify.identify(conn);
        if(this.DHTServer) {
          node.services.pubsub.subscribe(`${evt.detail.toString()}`)
        }
      })
      // Establish connections on peer discovery 
      node.addEventListener('peer:discovery', async (evt) => {
        if(evt.detail.multiaddrs.length > 0) {
          logger.info(`Discovered - peer=${evt.detail.id.toString()} total=${(await node.peerStore.all()).length}`);
          if(this.DHTServer) {
            node.services.pubsub.subscribe(`${evt.detail.id.toString()}`)
          }
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
            logger.info(`Received sync request - peer=${from}`);
            this.dialPeerSync(from);
          }
        } else if(evt.detail.topic === 'checkpoint'){
          const { root, epoch } = JSON.parse(uint8ArrayToString(evt.detail.data));
          logger.info(`Vote - peer=${from} root=${root} epoch=${epoch}`);
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

      if(!this.nat) {
        await node.services.nat.stop();
      }

      await setTimeout(10000);

      node.getMultiaddrs().forEach((ma) => {
        logger.info(`P2P listening - multiaddress=${ma.toString()}`)
      })

      this.node = node;
    } catch(err: any) {
      logger.error(err);
    }
  }

  async requestSync(peers?: PeerId[]) {
    try {
      await this._waitForPeers();
      const node: any = this.node;

      const peerId = peers
        ? peers[Math.floor(Math.random() * peers.length)] 
        : await this._getRandomPeer();

      logger.info(`Requesting sync - peer=${peerId.toString()}`)

      await node.services.pubsub.publish(
        peerId.toString(), 
        uint8ArrayFromString('sync'),
      );
    } catch(err: any) {
      logger.error(err);
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
      logger.error(err);
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
      logger.error(err);
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
    const maxTimeout = 60000;
    let count = 0;
    const peers = await this.node.peerStore.all();

    while(this.consensus.votes[epoch].length < (peers.length + 1) && count < maxTimeout) {
      await setTimeout(10000);
      count += 10000;
    } 

    if(this.consensus.votes[epoch].length === 1) {
      try {
        const peerId = peerIdFromString(this.bootstrapers[0].split("p2p/")[1]); 
        await this.node.peerStore.patch(
          peerId, 
          { multiaddrs: [multiaddr(this.bootstrapers[0])] }
        );
        await this.node.dial(peerId);
      } catch {
        logger.warn("Bootstrapping node not reachable");
      }
    }
  }

  private async _waitForPeers(): Promise<void> {
    const maxTimeout = 30000;
    let count = 0;

    logger.info("Waiting for peers...");

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

