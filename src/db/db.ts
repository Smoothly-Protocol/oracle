import { Trie, MapDB } from '@ethereumjs/trie'
import { RLP } from '@ethereumjs/rlp'
import { Level } from 'level';
import { DEFAULTS } from '../config';
import { LevelDB } from './level';
import { Validator } from '../types';
import { BigNumber } from "ethers";
import { homedir } from 'os';

export class DB {
  db: Trie;
  level: Level;

  constructor(_root: string, _testing: boolean) {
    try {
      this.level = new Level(`${homedir}/${DEFAULTS.folder}/db`);
      this.db = new Trie({
        db: _testing ? new MapDB() : new LevelDB(this.level),
        useKeyHashing: true,
        root: Buffer.from(_root, 'hex')
      })
    } catch(err: any) {
      throw new Error("MPT trie for db failed to initialize");
    }
  }

  async insert(index: number, validator: Validator): Promise<void> {
    const key = `${index}`;
    const obj = JSON.stringify(validator);
    await this.db.put(Buffer.from(key), Buffer.from(obj));
  }

  async get(index: number): Promise<Validator | undefined> {
    const key = `${index}`;
    const validator = await this.db.get(Buffer.from(key));
    return validator != null 
      ? JSON.parse(validator.toString()) 
      : undefined;
  }

  async delete(index: number): Promise<void> {
    const key = `${index}`;
    await this.db.del(Buffer.from(key));
  }

  async getProof(index: number): Promise<any> {
    const key = Buffer.from(`${index}`);
    const root = this.db.root();
    const proof = await this.db.createProof(key);
    const value = await this.db.verifyProof(root, key, proof) as Buffer;
    return value != null ? [proof, value] : undefined;
  }

  async getStream(): Promise<any> {
    return await this.db.createReadStream();
  }

  async getRootState(_root: string): Promise<any> {
    try {
      await this.level.close();

      const level = new Level(`${homedir}/${DEFAULTS.folder}/db`);
      const trie = new Trie({
        db: new LevelDB(level),
        useKeyHashing: true,
        root: Buffer.from(_root.slice(2), 'hex')
      })

      let validators: Validator[] = [];
      const stream = await trie.createReadStream();
      const root = await trie.root();

      await new Promise((fulfilled) => { 
        stream
        .on('data', async (data: any) => {
          validators.push(JSON.parse(data.value.toString()));
        })
        .on('end', fulfilled);
      });

      await level.close()
      await this.level.open();

      return {
        root: root.toString('hex'),
        data: validators
      };
    } catch(err: any) {
      console.log(err);
    }
  }

  root(): Buffer {
    return this.db.root();
  }
}
