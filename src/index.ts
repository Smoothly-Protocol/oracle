import { Oracle } from './oracle';
import { Command } from 'commander';

const program = new Command();

// CLI Helper
program
  .name('smoothly-node')
  .description('CLI for running a node that supoorts the smoothly pool validator network')
  .version('0.0.1')
  .usage('[OPTIONS]...')
  .option('-n, --network <value>', 'Select network [goerli, mainnet]', 'local')
  .requiredOption('-pk, --private-key <value>', 'Add eth1 validator account private key.')
  .parse(process.argv);

const opts = program.opts();

async function main(): Promise<void> {
  try {
    const pk = opts.privateKey; //"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff"
    const network = opts.network;
    const oracle = new Oracle(network, pk);
    // TODO: Sync node from beginning
    oracle.rebalance();
  } catch(err) {
    console.error(err);
  }
}

main()
.catch(error => {
  console.error(error);
  process.exit(1);
});

