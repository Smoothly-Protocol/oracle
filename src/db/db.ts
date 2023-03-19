import { Trie, MapDB } from '@ethereumjs/trie'
import { RLP } from '@ethereumjs/rlp'
import { Level } from 'level';
import { DEFAULTS } from '../utils';
import { LevelDB } from './level';
import { Validator } from '../types';

export class DB {
  db: Trie;

  constructor(_root: string, _testing: boolean) {
    try {
      let db;
      if(_testing) {
        db = new MapDB(); 
      } else {
        db = new LevelDB(new Level(`${DEFAULTS.folder}/db`))
      }
      this.db = new Trie({
        db: db,
        useKeyHashing: true,
        root: Buffer.from(_root.slice(2), 'hex')
      })
    } catch(err: any) {
      throw new Error("MPT trie for db failed to initialize");
    }
  }

  async insert(eth1: string, index: number, validator: Validator): Promise<void> {
      const key = `${eth1}${index}`.toLowerCase();
      const obj = JSON.stringify(validator);
      await this.db.put(Buffer.from(key), Buffer.from(obj));
  }

  async get(eth1: string, index: number): Promise<Validator | undefined> {
    const key = `${eth1}${index}`.toLowerCase();
    const validator = await this.db.get(Buffer.from(key));
    return validator != null 
      ? JSON.parse(validator.toString()) 
      : undefined;
  }

	async delete(eth1: string, index: number): Promise<void> {
    const key = `${eth1}${index}`.toLowerCase();
    await this.db.del(Buffer.from(key));
	}

  async getProof(eth1: string, index: number): Promise<any> {
    const key = Buffer.from(`${eth1}${index}`.toLowerCase());
    const root = this.db.root();
    const proof = await this.db.createProof(key);
    const value = await this.db.verifyProof(root, key, proof) as Buffer;
    return value != null ? [proof, value] : undefined;
  }
}
