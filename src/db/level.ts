import { BatchDBOp, DB } from '@ethereumjs/trie'
import { Level } from 'level';

const ENCODING_OPTS = { keyEncoding: 'buffer', valueEncoding: 'buffer' };

interface ITERATOR {
  iterator(filter: object): Promise<object>;
}

export class LevelDB implements DB, ITERATOR {
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

  async iterator(filter: object): Promise<any> {
    let values = [];
    for await (const [key, value] of this._leveldb.iterator(filter)) {
      values.push(JSON.parse("{"+value.split("{")[1]));
    }
    return values;
  }

  copy(): DB {
    return new LevelDB(this._leveldb)
  }
}


