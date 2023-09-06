import { BigNumber, utils } from "ethers";

async function main () {
  try {
    let initRewards: BigNumber = BigNumber.from("0");
    let initStake: BigNumber = BigNumber.from("0");
    let initBalance: BigNumber = BigNumber.from("0");

    const res = await fetch('https://node-goerli.smoothly.money/checkpoint');
    const checkpoint = await res.json();

    for(let validator of checkpoint.data) {
      if(BigNumber.from(validator.rewards).lt(0)) {
        console.warn("Overdrawn rewards balance for:", validator.index); 
      } else if(BigNumber.from(validator.rewards).lt(0)) {
        console.warn("Overdrawn stake balance for:", validator.index); 
      } else if(BigNumber.from(validator.stake).gt(utils.parseEther("0.065"))) {
        console.warn("stake balance too big for:", validator.index); 
      }
      initRewards = initRewards.add(BigNumber.from(validator.rewards));
      initStake = initStake.add(BigNumber.from(validator.stake));
    }
    initBalance = initBalance.add(initRewards).add(initStake);

    console.log("Total Balance:", utils.formatEther(initBalance));
    console.log("Total Rewards:", utils.formatEther(initRewards));
    console.log("Total Stake:", utils.formatEther(initStake));

  } catch(err: any) {
    console.log(err);
  }
}

main();
