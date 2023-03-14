import { Config } from './config';
import * as path from 'path';

import { Command } from 'commander';
const program = new Command();

import { 
  startRegistrationListener 
} from "./listeners";

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
    const config = await(new Config(network, pk)).initDB();

    // Init event Listeners
    startRegistrationListener(config);
    /*
    startDeactivationListener(contract);
    startBlockListener(contract);
    startRebalancerCron(contract);
    startVoluntaryExitsListener();
    */
  } catch(err) {
    console.error(err);
  }
}

main()
.catch(error => {
  console.error(error);
  process.exit(1);
});

