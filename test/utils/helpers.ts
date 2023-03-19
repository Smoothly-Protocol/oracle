import { Trie } from '@ethereumjs/trie';

export async function getProof(user: any, trie: Trie) {
  const key = Buffer.from(user.address.toLowerCase());
  const proof = await trie.createProof(key);
  const value = await trie.verifyProof(trie.root(), key, proof) as Buffer;
  return [proof, value];
}

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/*
export function decodeUser(data: any): User[] {
  for(let i = 0; i < data.length; i++) {
    for(let x = 0; x < data[i].length; x++) {
      if(data[i][x] == 0) {
        data[i][x] = 0;
      } else {
        data[i][x] = bufferToNumber(Buffer.from(data[i][x]));
      }
    }
  } 
  return data;
}

function bufferToNumber(buf: Buffer): number {
  return Number(`0x${buf.toString('hex')}`);
}
*/
