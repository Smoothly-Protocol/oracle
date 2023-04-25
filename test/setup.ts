import { Oracle } from "../src/oracle";
import { EMPTY_ROOT } from "../src/utils";
import { pool, governance } from "../src/artifacts";
import { 
  Wallet, 
  ContractFactory,
  providers
} from "ethers";

// Default 10 accounts from anvil
export const pks = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
  "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
  "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
  "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6"
];

export function getSigners(provider: any): Array<Wallet> {
  return pks.map((pk: string): Wallet => { return new Wallet(pk, provider) });
}

export async function time1Day(provider: any): Promise<void> {
  const oneDay = 24 * 60 * 60;
  await provider.send("evm_increaseTime",[oneDay]);
}

export async function setup(): Promise<Oracle> {
  try {
    const provider = new providers.JsonRpcProvider("http://127.0.0.1:8545");
    const [owner] = await getSigners(provider);
    const oracle = new Oracle("local", pks[0], EMPTY_ROOT);
    const contract = await(new ContractFactory(
      pool["abi"], 
      pool["bytecode"],
      owner
    )).deploy();
    const gov = await(new ContractFactory(
      governance["abi"], 
      governance["bytecode"],
      owner
    )).deploy(contract.address);
    await contract.transferOwnership(gov.address);
    await gov.addOperators([owner.address]);
    oracle.updateContract(contract, gov);
    return oracle;
  } catch (err: any) {
    throw new Error(err);
  }
}
