import fs from "fs";
import * as path from 'path';
import { homedir } from 'os';
import { Trie, MapDB } from '@ethereumjs/trie'
import { RLP } from '@ethereumjs/rlp'
import { Level } from 'level';
import { DEFAULTS } from '../config';
import { LevelDB } from './level';
import { Validator } from '../types';
import { BigNumber } from "ethers";

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

  async hasRoot(_root: string): Promise<boolean> {
    try {
      return await this.db.checkRoot(Buffer.from(_root.slice(2), 'hex')); 
    } catch(err: any) {
      console.log(err);
      return false;
    }
  }

  async revert(): Promise<void> {
    try {
      await this.db.revert();
    } catch(err: any) {
      console.log(err);
    }
  }

  checkpoint(epoch: number): void {
    this.db.checkpoint();

    // Write new Head to Disk
    fs.writeFileSync(
      path.resolve(homedir(), ".smoothly/head.json"), 
      JSON.stringify({root: this.root().toString('hex'), epoch: epoch})
    )
  }

  root(): Buffer {
    return this.db.root();
  }
}
