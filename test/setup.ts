import { Oracle } from "../src/oracle";
import { EMPTY_ROOT } from "../src/utils";
import { pool, governance } from "../src/artifacts";
import { 
  Wallet, 
  Contract,
  ContractFactory,
  providers,
  constants
} from "ethers";

// Default 10 accounts from anvil
export const pks = [
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  "8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  "92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
  "4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
  "dbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
  "2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6"
];

export const provider = new providers.JsonRpcProvider("http://127.0.0.1:8545");

export function getSigners(provider: any): Array<Wallet> {
  return pks.map((pk: string): Wallet => { return new Wallet(pk, provider) });
}

export async function time1Day(provider: any): Promise<void> {
  const oneDay = 25 * 60 * 60;
  const sevenDays = 7 * oneDay;
  await provider.send("evm_increaseTime",[sevenDays]);
}

export async function getBlockNumber() {
  return await provider.send("eth_blockNumber",[]);
}

export async function setup(): Promise<Oracle> {
  try {
    const provider = new providers.JsonRpcProvider("http://127.0.0.1:8545");
    const [owner, second] = await getSigners(provider);
    const oracle = new Oracle({
      network: "local", 
      privateKey: pks[0],
      eth1: [],
      beacon: []
    }, EMPTY_ROOT);
    const gov = await(new ContractFactory(
      governance["abi"], 
      governance["bytecode"],
      owner
    )).deploy([owner.address, second.address], constants.AddressZero);
    const poolAddress = await gov.pool();
    const _pool: Contract = new Contract(
      poolAddress,
      pool["abi"],
      owner 
    );
    oracle.updateContract(_pool, gov);
    return oracle;
  } catch (err: any) {
    throw new Error(err);
  }
}
