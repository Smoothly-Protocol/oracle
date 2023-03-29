import { Trie } from '@ethereumjs/trie';
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

export async function getProof(user: any, trie: Trie) {
  const key = Buffer.from(user.address.toLowerCase());
  const proof = await trie.createProof(key);
  const value = await trie.verifyProof(trie.root(), key, proof) as Buffer;
  return [proof, value];
}

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export function getMerkleProof(tree: any, addr: string): any {
  for (const [i, v] of tree.entries()) {
    if(v[0] === addr) {
      return tree.getProof(i);
    }
  }
}

