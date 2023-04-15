import { Oracle } from './oracle';
import { API } from './api';
import { Command } from 'commander';

const program = new Command();

// CLI Helper
program
  .name('smoothly-node')
  .description('CLI for running a node that supoorts the smoothly pool validator network')
  .version('0.0.1')
  .usage('[OPTIONS]...')
  .option('-n, --network <value>', 'Select network [goerli, mainnet]', 'local')
  .option('-s, --sync <checkpoint>', 'Select checkpoint to sync from')
  .requiredOption('-pk, --private-key <value>', 'Add eth1 validator account private key.')
  .parse(process.argv);

const opts = program.opts();

async function main(): Promise<void> {
  try {
    const pk = opts.privateKey; 
    const network = opts.network;
    const checkpoint = opts.checkpoint || undefined;
    const port = process.env.PORT || 4000;
    const oracle = new Oracle(network, pk);
    const api =  new API(oracle, port as number);
    // Sync from checkpoint if provided
    if(checkpoint) {
      await oracle.sync(checkpoint);
    } 
    oracle.start();
  } catch(err) {
    console.error(err);
  }
}

main()
.catch(error => {
  console.error(error);
  process.exit(1);
});

