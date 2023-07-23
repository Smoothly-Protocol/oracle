#!/usr/bin/node --experimental-specifier-resolution=node

import { Oracle } from './oracle';
import { API } from './api';
import { Command } from 'commander';
import { EMPTY_ROOT, existsHead } from './utils';

const program = new Command();

// CLI Helper
program
.name('smoothly-node')
.description('CLI for running a node that supoorts the smoothly pool validator network')
.version('0.0.1')
.usage('[OPTIONS]...')
.option('-n, --network <value>', 'Select network [goerli, mainnet]', 'goerli')
.option('-s, --sync <value>', 'Select checkpoint to sync from')
.option('-p, --http-api <port>', 'Port for http api [default: 4040]', '4040')
.option('-b, --beacon <value>', 'Add custom beacon node')
.option('-eth1, --eth1 <value>', 'Add custom eth1 rpc endpoint')
.option('-f, --max-base-fee <value>', 'Specify max base fee allowed to pay for gas')
.requiredOption('-pk, --private-key <value>', 'Add eth1 validator account private key.')
.parse(process.argv);

const opts = program.opts();

async function main(): Promise<void> {
  try {
    const checkpoint = opts.sync;
    const port = Number(opts.httpApi);

    let root = EMPTY_ROOT;
    let epoch = 0;

    // Get Head state 
    const data = existsHead();
    if(data) {
      root = data.root;
      epoch = Number(data.epoch) + 1;
    } 

    const oracle = new Oracle(opts, root);
    const api =  new API(oracle, port as number);

    await oracle.start(epoch, root, checkpoint);
  } catch(err: any) {
    if(err.message === 'Sync failed, make sure checkpoint is active') {
      throw err;
    }
    console.error(err);
  }
}

main()
.catch(error => {
  console.error(error);
  process.exit(1);
});

