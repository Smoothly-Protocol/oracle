#! /usr/bin/env node 

import { Oracle } from './oracle';
import { API } from './api';
import { Command } from 'commander';
import { EMPTY_ROOT, existsHead, logger } from './utils';

const program = new Command();

// CLI Helper
program
.name('smoothly-node')
.description('CLI for running a node that supoorts the smoothly pool validator network')
.version('0.0.1')
.usage('[OPTIONS]...')
.option('-n, --network <value>', 'Select network [goerli, mainnet]', 'goerli')
.option('-s, --sync <url>', 'Select checkpoint to sync from')
.option('-p, --http-api <port>', 'Port for http api [default: 4040]', '4040')
.option('-b, --beacon <separetd comma urls>', 'Add custom beacon node')
.option('-eth1, --eth1 <separated comma urls>', 'Add custom eth1 rpc endpoint')
.option('-pinata, --pinataJWT <JWT-token>', 'Pinata JWT token to push state files to ipfs')
.option('-nat, --autoNAT', 'Specify if NAT Traversal is needed [default: activated]', true)
.option('-server, --DHTServer', 'Use with Bootsraper node DHT Server config [default: deactivated]', false)
.option('-ip, --announceIp <ip>', 'Specify ip to announce to other peers')
.option('-dns, --announceDns <dns>', 'Specify dns to announce to other peers')
.option('-p2pPort, --p2pPort <port>', 'Specify port to listen to p2p connections [default: 5040]', '5040')
.requiredOption('-pk, --private-key <value>', 'Add eth1 validator account private key.')
.parse(process.argv);

const opts = program.opts();

async function main(): Promise<void> {
  try {
    opts.eth1 = opts.eth1 
      ? opts.eth1.split(",").map((e: string) => e.trim())
      : [];

    opts.beacon = opts.beacon 
      ? opts.beacon.split(",").map((e: string) => e.trim())
      : [];

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
    logger.error(err);
  }
}

main()
.catch(error => {
  logger.error(error);
  process.exit(1);
});

