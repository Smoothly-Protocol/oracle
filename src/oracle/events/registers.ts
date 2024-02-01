import { providers, Contract, utils, BigNumber } from "ethers";
import { ValidatorInfo, Validator } from "../../types";
import { Oracle } from '../oracle';
import { STAKE_FEE, logger } from "../../utils";

export function Registered(oracle: Oracle): void {
  const contract = oracle.contract;
  const filter = contract.filters.Registered();
  contract.on(filter, (sender, indexes) => {
    verifyValidator(sender, indexes, oracle);
  });
  console.log("Listening to register events");
}

export async function verifyValidator(
  eth1Addr: string, 
  indexes: number[],
  oracle: Oracle 
) {
  try { 
    const data = await getValidators(eth1Addr, oracle);

    for(let id of indexes) {
      const { verified, index } = proofOwnership(eth1Addr, id, data);
      if(verified) {
        const validator: Validator | undefined = await oracle.db.get(index);
        if(!validator) {
          const newUser: Validator = {
            index: index, 
            eth1: eth1Addr.toLowerCase(),
            rewards: BigNumber.from("0"),
            slashMiss: 0,
            slashFee: 0, 
            stake: STAKE_FEE,
            firstBlockProposed: false, 
            firstMissedSlot: false,
            excludeRebalance: false,
            exitRequested: false,
            active: true,
            deactivated: false
          };
          await oracle.db.insert(index, newUser);
          logger.info(`Registration Successfull - validator_index=${index} address=${eth1Addr}`)
        } else if(validator.deactivated) {
          logger.info(`Validator Deactivated - validator_index=${index} address=${eth1Addr}`)
        } else if(!validator.active) {
          validator.active = true;
          validator.stake = STAKE_FEE;
          validator.firstBlockProposed = false;
          await oracle.db.insert(index, validator);
          logger.info(`Welcome back - validator_index=${index} address=${eth1Addr}`)
        } else if(validator.active) {
          logger.info(`Validator already registered - validator_index=${index} address=${eth1Addr}`)
        }
      } else {
        logger.info(`Unowned User - validator_index=${id} address=${eth1Addr}`);
      }
    }
  } catch(err: any) {
    logger.error(err);
  } 
}

function proofOwnership(
  eth1Addr: string, 
  id: number, 
  data: Array<ValidatorInfo>
): {verified: boolean, index: number} {
  const len = data.length;
  let verified: boolean = false;
  let index: number = 0;
  if(len > 0) {
    for(let i = 0; i < len; i++) {
      if(data[i].validatorindex == id) {
        verified = true;
        index = Number(data[i].validatorindex);
        return { verified, index }; 
      }
    }
  }
  return { verified, index };
}

export async function getValidators(eth1Addr: string, oracle: Oracle): Promise<Array<ValidatorInfo>> {
  try {
    const deposit = `${oracle.network.beaconchainApi}/api/v1/validator/eth1/${eth1Addr}`;
    const withdrawal = `${oracle.network.beaconchainApi}/api/v1/validator/withdrawalCredentials/${eth1Addr}`;
    const headers = {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    }

    let data: Array<ValidatorInfo> = [];
    const validatorsDeposit = await(await fetch(deposit, headers)).json();
    validatorsDeposit.status === "OK" 
      ? data = data.concat(validatorsDeposit.data) 
      : 0;

    const validatorsWithdrawal = await(await fetch(withdrawal, headers)).json();
    validatorsWithdrawal.status === "OK" 
      ? data = data.concat(validatorsWithdrawal.data) 
      : 0;

    return data;
  } catch(err: any) {
    throw err;
  }
}
