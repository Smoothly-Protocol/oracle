#!/usr/bin/node --experimental-specifier-resolution=node

import fs from "fs";
import * as path from 'path';
import { homedir } from 'os';
import { Oracle } from './oracle';
import { API } from './api';
import { Command } from 'commander';
import { EMPTY_ROOT } from './utils';
import { Head } from './types';
import { Node } from './p2p';
import { multiaddr } from '@multiformats/multiaddr'

const program = new Command();

// CLI Helper
program
.name('smoothly-node')
.description('CLI for running a node that supoorts the smoothly pool validator network')
.version('0.0.1')
.usage('[OPTIONS]...')
.option('-n, --network <value>', 'Select network [goerli, mainnet]', 'goerli')
.option('-s, --sync <value>', 'Select checkpoint to sync from')
.option('-b, --beacon <value>', 'Add custom beacon node')
.option('-f, --max-base-fee <value>', 'Specify max base fee allowed to pay for gas')
.requiredOption('-pk, --private-key <value>', 'Add eth1 validator account private key.')
.parse(process.argv);

const opts = program.opts();

async function main(): Promise<void> {
  try {
    const checkpoint = opts.sync || undefined;
    const port = process.env.PORT || 4040;

    let root = EMPTY_ROOT;
    let epoch = 0;

    // Get Head state 
    const data = existsHead();
    if(data) {
      root = data.root;
      epoch = Number(data.epoch) + 1;
    } 

    const bootstrapers = [
      '/dns4/auto-relay.smoothly.money/tcp/443/wss/p2p/12D3KooWEgbxnySb9F739q8P5uqsNZfb3pDMjQ2A6ZwJRef6KP1J',
    ]

    const node = await(new Node()).createNode(bootstrapers);

    node.addEventListener('peer:discovery', (evt) => {
        console.log(`Peer ${node.peerId.toString()} discovered: ${evt.detail.id.toString()}`)
    })

    await node.start();

    node.services.pubsub.subscribe('news')
    node.services.pubsub.addEventListener('message', (evt) => {
      if(evt.detail.topic === "news") {
        console.log(`node received: ${Buffer.from(evt.detail.data).toString()} on topic ${evt.detail.topic}`)
      }
    })

    setInterval(() => {
      node.services.pubsub.publish("news", Buffer.from('Hello p2p'));
    }, 1000)

    const oracle = new Oracle(opts, root);
    const api =  new API(oracle, port as number);

    // Sync from checkpoint if provided
    if(checkpoint) {
      console.log("Syncing from checkpoint node...");
      await oracle.sync(checkpoint);
    } else {
      console.log("Syncing from last root known:", root);
      await oracle.fullSync(epoch);
    }

    oracle.start();
  } catch(err: any) {
    if(err.message === 'Sync failed, make sure checkpoint is active') {
      throw err;
    }
    console.error(err);
  }
}

function existsHead(): Head | null {  
  try {
    const data: Head = JSON.parse(
      fs.readFileSync(
        path.resolve(homedir(), `.smoothly/head.json`),
        'utf8'
      )
    );
    return data; 
  } catch {
    return null;
  }
}

main()
.catch(error => {
  console.error(error);
  process.exit(1);
});

