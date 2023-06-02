import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { yamux } from '@chainsafe/libp2p-yamux'
import { noise } from '@chainsafe/libp2p-noise'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'
import { circuitRelayServer } from 'libp2p/circuit-relay'

async function main() {
  try {
    const relay = await createLibp2p({
        addresses: {
          listen: [
            '/ip4/0.0.0.0/tcp/0'
          ]
        },
        transports: [tcp()],
        streamMuxers: [yamux(), mplex()],
        connectionEncryption: [noise()],
        services: {
          pubsub: gossipsub({ allowPublishToZeroPeers: true }),
          relay: circuitRelayServer()
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
