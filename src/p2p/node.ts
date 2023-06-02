import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { yamux } from '@chainsafe/libp2p-yamux'
import { noise } from '@chainsafe/libp2p-noise'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { bootstrap } from '@libp2p/bootstrap'
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'

export class Node {
  node: any;

  constructor(bootstrapers: string[]) {
    this.createNode(bootstrapers).then(async (node) => {
      node.addEventListener('peer:discovery', (evt) => {
          console.log(`Peer ${node.peerId.toString()} discovered: ${evt.detail.id.toString()}`)
      })
      this.node = node;
      await this.start();
    });
  }

  async start() {
    const node = this.node;
    await node.start();
    console.log("Started p2p node with peerId:", node.peerId.toString());
  }

  async createNode(bootstrapers: any) {
    const node = await createLibp2p({
      addresses: {
        listen: ['/ip4/0.0.0.0/tcp/0']
      },
      transports: [
        tcp()
      ],
      streamMuxers: [
        yamux(),mplex()
      ],
      connectionEncryption: [
        noise()
      ],
      services: {
        pubsub: gossipsub({ allowPublishToZeroPeers: true })
      },
      peerDiscovery: [
       bootstrap({
          list: bootstrapers
        }),
        pubsubPeerDiscovery({
          interval: 1000,
        })
      ],
    })
    return node
  }
}

