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
import { multiaddr } from '@multiformats/multiaddr'
import { pipe } from 'it-pipe'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

export const createNode = async (bootstrapers: string[]) => {
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
					list: bootstrapers
				}),
				pubsubPeerDiscovery({
					interval: 1000,
				})
			],
		})

		node.services.pubsub.subscribe('news:sync')

		node.addEventListener('peer:connect', (evt) => {
			const peerId = evt.detail
			console.log('Connection established to:', peerId.toString())  // Emitted when a peer has been found
		})

		node.addEventListener('peer:discovery', async (evt) => {
			const peerId = evt.detail.id.toString();	
			const { addresses } = evt.detail as any;
			
			// Sync from last known hash
			if(addresses.length > 0) {
				const p2pCircuit = addresses[0].multiaddr;
				const stream1 = await node.dialProtocol(p2pCircuit, ['/chat/1.0.0'])
				const req = await fetch('http://localhost:4040/checkpoint');
				const res = await req.json();
				await pipe(
					[uint8ArrayFromString(JSON.stringify(res))],
					stream1
				)
			}
			console.log("Discovered:", peerId);
		})

		node.services.pubsub.addEventListener('message', (evt) => {
			if(evt.detail.topic === "news:sync") {
				console.log(`node received: ${Buffer.from(evt.detail.data).toString()} on topic ${evt.detail.topic}`)
			}
		})

		node.handle('/chat/1.0.0', async ({ stream }) => {
			pipe(
				stream,
				async function (source) {
					for await (const msg of source) {
						console.log(uint8ArrayToString(msg.subarray()))
					}
				}
			)
		})

		await node.start();
		return node;
	} catch(err: any) {
		console.log(err);
	}
}

