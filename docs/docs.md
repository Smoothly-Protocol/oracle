# Smoothly Technical Documentation

The purpose of this document is to explain how the Smoothly Protocol works under 
the hood and our approach to build a smoothing pool to aggregate and average 
feeRecipient rewards for home validators.

The reader should be familiar with the concept of events in a smart contract and 
an understanding of how feeRecipient rewards work in eth2.0.

## Introduction

In order to aggregate and average rewards for home validators, we need two main 
components:

1. **Smart contract**, used as the `feeRecipient` address of all validators.
2. **Operator Node**, used as an oracle that `monitors` and `verifies` validators 
and keeps track of their `state` in the beacon chain.

For this to work, we use events in the smart contract as the primary method for 
communication between the two.

Furthermore, for the Operator Node to verify and keep track of the validators in the 
beacon chain, we use a `beacon node HTTP API` to query for new proposed slots with 
our `feeRecipient` address and keep track of the state with a local `leveldb` database.

## Smoothly Pool Contract

The pool is in charge of:  

1. Recieve validator rewards as `feeRecipient`.
2. Withdrawals.
3. Exits. 
4. Adding Stake.
5. Communication with Operator Node via `events` emited.
6. Holds entire treasury of the Pool (staked eth and rewards).

### Registration
Any validator can join our smoothing pool, in two simple steps: 

1. Change their validators `feeRecipient` address to our Smoothing Pool contract address.
2. Register through smart contract using our [website](https://goerli-v2.smoothly.money/).

The `eth1 deposit` address should be used to login and register as that's how we 
detect and verify ownership of validators.

During registration, a user will `stake 0.65 ETH` into our contract as a promise 
to be a good actor. This ETH will be used to penalize the validator in case of a 
missed proposal or a block proposed with a different `feeRecipient` address happens. 

It is possible to interact with the contract directly for registrations, but we 
recommend using our website as it detects your associated validators beforehand.  
In the case of a user trying to register unowned or deactivated validators through 
our contract via `registerBulk(uint[] memory indexes)` will lose all funds as 
Operator Nodes will reject registration on pick up of `Registered(address indexed eth1, uint[] indexes)`
event.

**Disclaimer:** Any other `eth` send to our contract will be gladly accepted and
distributed amongst all of the validators participating in the pool. 

### Withdrawals 
Once a validator is `registered`, it will be included in next rabalances and start 
earning rewards straight away. However, the validator will not have withdrawals 
enabled until the validator proposes the first slot with our `feeRecipient` 
address. This is when it becomes `verified`. After that, the validator will be 
able to withdraw their rewards at any time.

Rewards are distributed to all of the participant at every rebalance, currently
happening every `1 day` on goerli `2 weeks` on mainnet.

### Exits 
A validator can Exit the pool at any time and get their `0.65 ETH` stake position back 
as long as he didn't get penalized.  

To prevent bad actors from exiting the pool before they get penalized on rebalances,
a request has to be done first to exit. Then, the validator will be able to claim 
their stake back after the next rebalance.   

### Add Stake  
A validator can add stake to their position in case it gets penalized by missing
a slot. Thrugh `addStake(uint index)` anyone can call this to top up their stake. 
If interacting directly make sure the index of the validator is already registered
and is missing some stake. All other `eth` send will be lost and included in the 
next rebalance as rewards to distribute. This is why we recommend our website to interact 
with our contract safely.  

**Info:** Withdrawals and exits are enabled and updated at every rebalance using 
Merkle Proofs.  

## Operator Node
The operator node is a cli program that works as an oracle monitoring the beacon
chain state as well as all the events that happen in the pool: withdrawals, exits, registration...   

This node computes and saves the state using a `Merkle Patricia Trie` implementation 
with `levelDB` on disk. This implementation, allows us to track all of the previous states since deployment and 
share the state with the smoothly pool contract in order to enable withdrawals and 
exits through merkle proofs.  

Anyone can run this node to verify that the state is updating correctly in real time. 
However, in order to propose a rebalance vote with the new state for the `pool` you 
have to become an approved operator.  

Approved Operators, are whitelisted in our `poolGovernance` contract and propose
a `vote` on rebalance with the computed root hash of the new state. The `poolGovernance`
contract, then makes sure that all approved operators reach a consensus of at least `66%`
before updating the state of the `pool` contract.  

For performing this tasks, approved operators will share a `1.5%` fee of the total 
rewards of that rebalance.   

### Rebalancing 
Because of ethereum `gas costs`, we only update the state of the contract once 
every period of time. Currently `1 day` on goerli and `2 weeks` on mainnet as long
as there's more than `0.001 ETH` of total rewards to rebalance. 

### Monitoring the beacon node
It is very important for the efficiency of the smoothing pool, to punish bad 
actors and exclude them from accruing rewards. That way, we can 
distribute more rewards to true working validators participating on the pool. 

In order to do that we listen to the beacon node using the HTTP API for `new finalized`
epochs. Next, we query all of the slots on the epoch and look for validators that 
missed a slot, exit the beacon chain voluntarily or propose a slot with the wrong 
`feeRecipient` and penalize accordingly. 

### Smoothly Pool event listeners
The node is subscribed to a series of event listeners in the `pool` contract as 
a way to store all user interactions on chain and retrieve them to update the 
state of all validators. 

### State
State is stored on disk, using `levelDB` which helps us store all of the data
of the Merkle Patricia Trie. Data is stored as key-value mapping being:  
**key**: validator index    
**value**:
```
export interface Validator {
  index: number, 
  eth1: string,
  rewards: BigNumber, 
  slashMiss: number, 
  slashFee: number 
  stake: BigNumber, 
  firstBlockProposed: boolean, 
  firstMissedSlot: boolean,  
  exitRequested: boolean,
  active: boolean,
  deactivated: boolean
}
```

### Monitoring relays 

The main advantages for using relays are 2: 
1. Higer MEV coming to the pool. 
2. Helps us detect quickly the change of a validators `feeRecipient` through the 
relay registration. This helps us a lot to distribute rewards on a more efficient manner as
all bad actors are excluded from rebalances if we detect a change in the `feeRecipient` 
address. 

The following are the 3 relays we are currently monitoring before rebalance to 
exclude bad actors: 
```
https://boost-relay-goerli.flashbots.net
https://relay-stag.ultrasound.money
https://goerli.aestus.live
```

We are not currently enforcing the use of relays to participate on our pool, 
but might be something we do in the future as it helps the pool to distribute
rewards more evenly.  


## Penalties and Bad Actors

There are a number of punishable events:  

1. A validator changing the `feeRecipient` to an address other than our pool 
contract will get slashed `0.65 ETH` and will cause deactivation immediately.   
2. A validator missing a block proposal will get slashed `0.15 ETH` and will be 
have to top up their stake position back to `0.65 ETH` to keep earning rewards.  

Validators that exit the beacon chain through `voluntary_exits` won't get slashed,
but will get deactivated immediately. 

Finnally, Operator Nodes monitor all relays in order to check for validators changing 
their `feeRecipient` address. In this case validators won't get slashed but will be excluded on rebalances 
(not earning rewards) until Operator Nodes pick up the correct `pool feeRecipient`.  




