import { BatchDBOp, DB } from '@ethereumjs/trie'
import { Level } from 'level';
import { Validator } from '../types';

const ENCODING_OPTS = { keyEncoding: 'buffer', valueEncoding: 'buffer' };


export class LevelDB implements DB {
  _leveldb: Level<string, any>

  constructor(leveldb: Level<string, any>) {
    this._leveldb = leveldb 
  }

  async get(key: Buffer): Promise<Buffer | null> {
    let value = null
    try {
      value = await this._leveldb.get(key, ENCODING_OPTS)
    } catch (error: any) {
      // This should be `true` if the error came from LevelDB
      // so we can check for `NOT true` to identify any non-404 errors
      if (error.notFound !== true) {
        throw error
      }
    }
    return value
  }

  async put(key: Buffer, val: Buffer): Promise<void> {
    await this._leveldb.put(key, val, ENCODING_OPTS)
  }

  async del(key: Buffer): Promise<void> {
    await this._leveldb.del(key, ENCODING_OPTS)
  }

  async batch(opStack: BatchDBOp[]): Promise<void> {
    await this._leveldb.batch(opStack, ENCODING_OPTS)
  }

  copy(): DB {
    return new LevelDB(this._leveldb)
  }
}


