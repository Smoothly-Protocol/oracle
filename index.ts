import { providers, Contract, utils } from "ethers";
import { Trie } from '@ethereumjs/trie'
import { Level } from 'level';
import { LevelDB } from './utils/level';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load Environment variables
dotenv.config({
	path: path.resolve(__dirname, '../.env')
});

// Merkle trie
const stateRoot = '0x880574a2aac265595827b78912c6e6e853042f8b12e12a93ccb6d06c7bc5738f';
const trie = new Trie({
  db: new LevelDB(new Level("./mydb")),
  useKeyHashing: true,
  root: Buffer.from(stateRoot.slice(2), 'hex')
});

/*
// DB
import { ObjectId } from "mongodb";
import { connectToDatabase } from "./db/src/database.service";
import User from "./db/models/user";

// Listeners
import { startRegistrationListener } from "./listeners/registerUser";
import { startDeactivationListener } from "./listeners/deactivateUser";
import { startBlockListener } from "./listeners/blockListener";
import { startVoluntaryExitsListener } from "./listeners/voluntaryExits";

// Cron job
import { startRebalancerCron } from "./jobs/rebalancer";
*/

/*
// Constants
const DB_STRING = process.env.DB_CONN_STRING as string;
const DB_NAME = process.env.DB_NAME as string;
const DB_USERS = process.env.USERS_COLLECTION_NAME as string;

// Blockchain config
const provider = new providers.JsonRpcProvider(process.env.GOERLI);
const contractAddress = "0x8d3b2dc0c22A2BDC17975c065a65637bD9d58F6B";	
const abi = [
	`event ValidatorRegistered(
		address indexed eth1_addr, string validator, uint id
	)`,
	"event ValidatorDeactivated(string validator)",
	"event RewardsRecieved(uint256 value, uint256 indexed timestamp)",
	"function rebalanceRewards(tuple(address,uint256,uint256,uint256,uint256,bool)[], uint fee) external",
	"function getRebalanceRewards() external view returns(uint)",
	"function getValidatorStake(address eth1Addr, uint id) external view returns(uint)",
  "function getValidator(address eth1Addr, uint id) external view returns(tuple(bytes,uint,uint,uint,uint,bool))"
];	
const contract = new Contract(contractAddress, abi, provider);
*/
async function main() {
	try {
    //await trie.put(Buffer.from('test'), Buffer.from('two')) 
    const value: any = await trie.get(Buffer.from('test'))
    console.log(value.toString()) // 'one'
    console.log(trie.root().toString('hex'));
    
    /*
		await connectToDatabase(DB_STRING, DB_NAME, DB_USERS);	
		startRegistrationListener(contract);
		startDeactivationListener(contract);
		startBlockListener(contract);
		startRebalancerCron(contract);
    startVoluntaryExitsListener();
   */
	} catch(err) {
		console.log(err);
	}
}

main()
.catch(error => {
	console.error(error);
	process.exit(1);
});

