import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { yamux } from '@chainsafe/libp2p-yamux'
import { noise } from '@chainsafe/libp2p-noise'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { floodsub } from '@libp2p/floodsub'
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'
import { circuitRelayTransport, circuitRelayServer } from 'libp2p/circuit-relay'
import { identifyService } from 'libp2p/identify'

async function main() {
  try {
    const relay = await createLibp2p({
        addresses: {
          listen: [
            '/ip4/0.0.0.0/tcp/0'
          ]
        },
        transports: [tcp(), circuitRelayTransport()],
        streamMuxers: [yamux(), mplex()],
        connectionEncryption: [noise()],
        services: {
          relay: circuitRelayServer(),
          identify: identifyService(),
          pubsub: floodsub()
        },
        peerDiscovery: [
          pubsubPeerDiscovery({
            interval: 1000,
          })
        ],
    })

    console.log(`libp2p relay starting with id: ${relay.peerId.toString()}`)

    await relay.start()

    const relayMultiaddrs = relay.getMultiaddrs();
    console.log(relayMultiaddrs);

  } catch(err) {
    console.log(err);
  }
}

main();
