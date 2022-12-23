import { Trie } from '@ethereumjs/trie';
import keccak256 from "keccak256";
import { RLP } from '@ethereumjs/rlp'
import { arrToBufArr } from '@ethereumjs/util'

import { bufferToNibbles } from './src/util/nibbles'
import { isTerminator } from './src/util/hex'

import { BranchNode } from './src/trie/node/branch'
import { ExtensionNode } from './src/trie/node/extension'
import { LeafNode } from './src/trie/node/leaf'

const trie = new Trie({useKeyHashing: true})
const trie2 = new Trie({useKeyHashing: true})

async function test() {
	for(let i = 0; i < 1000000; i++) {
		await trie.put(Buffer.from(`p${String(i)}`), Buffer.from("pepe"))
	}
	const proof = await trie.createProof(Buffer.from("p4"));
	//console.log(trie.root())
	//console.log(keccak256(proof[0]));// keccak256(proof[0]) is root
	/*	
	for(let i = 0; i < proof.length; i++) {
		console.log(decodeNode(proof[i]))
	}
   */
  console.log(proof);
}

export function decodeRawNode(raw: Buffer[]) {
  if (raw.length === 17) {
    return BranchNode.fromArray(raw)
  } else if (raw.length === 2) {
    const nibbles = bufferToNibbles(raw[0])
    if (isTerminator(nibbles)) {
      return new LeafNode(LeafNode.decodeKey(nibbles), raw[1])
    }
    return new ExtensionNode(ExtensionNode.decodeKey(nibbles), raw[1])
  } else {
    throw new Error('Invalid node')
  }
}

function decodeNode(raw: Buffer) {
  const des = arrToBufArr(RLP.decode(Uint8Array.from(raw))) as Buffer[]
  if (!Array.isArray(des)) {
    throw new Error('Invalid node')
  }
  return decodeRawNode(des)
}

test()
