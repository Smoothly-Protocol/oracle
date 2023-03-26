import { Trie, MapDB } from '@ethereumjs/trie'
import { RLP } from '@ethereumjs/rlp'
import { Level } from 'level';
import { DEFAULTS } from '../utils';
import { LevelDB } from './level';
import { Validator, Rebalancer } from '../types';
import { BigNumber } from "ethers";

export class DB {
  db: Trie;

  constructor(_root: string, _testing: boolean) {
    try {
			const root = "0x2d6f949ad492c5a3a1a55e2b49002e2a28de8c81eda9122afb8e50fa26d82a5e";
      this.db = new Trie({
        db: _testing ? new MapDB() : new LevelDB(new Level(`${DEFAULTS.folder}/db`)),
        useKeyHashing: true,
        root: Buffer.from(root.slice(2), 'hex')
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

	async getRebalancerData(): Promise<any> {
    let validValidators: Validator[] = [];
    let slashedValidators: Validator[] = [];
    let tRewards: BigNumber = BigNumber.from("0");
    let tStake: BigNumber = BigNumber.from("0");
		try { 
			const stream = await this.getStream();
			await new Promise((fulfilled) => { 
				stream
					.on('data', (data: any) => {
						const validator = JSON.parse(data.value.toString());

						tRewards = tRewards.add(BigNumber.from(`${validator.rewards}`));
						tStake = tStake.add(BigNumber.from(`${validator.stake}`));
						
						if(validator.slashFee === 0 && validator.slashMiss === 0) {
							validValidators.push(validator); 
						} else if(validator.active) {
							slashedValidators.push(validator);
						}
					})
					.on('end', fulfilled);
			});
			return { 
				validValidators: validValidators, 
				slashedValidators: slashedValidators, 
				tRewards: tRewards, 
				tStake: tStake 
			};
		} catch(err: any) {
			throw new Error(`Rebalance failed on iterator with: ${err}`);
		}
	}

  root(): Buffer {
    return this.db.root();
  }
}
