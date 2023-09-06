import type { Multiaddr } from '@multiformats/multiaddr'
import type { PeerId } from '@libp2p/interface-peer-id'

export interface Peer {
  address: Multiaddr;
  id: PeerId;
}

export interface Vote {
  id: PeerId;
  root: string;
} 
