import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { yamux } from '@chainsafe/libp2p-yamux'
import { noise } from '@chainsafe/libp2p-noise'
import { floodsub } from '@libp2p/floodsub'
import { bootstrap } from '@libp2p/bootstrap'
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'
import { identifyService } from 'libp2p/identify'

export class Node {
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
        pubsub: floodsub(),
        identify: identifyService()
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

