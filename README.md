# Smoothly Pool Validator Node

Starting work in levelDB integration

# Tests 

In order to run tests, the following configuration is needed:  
1. Local network: `anvil`.
2. Deploy Smoothly pool to local network:  
`forge create --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 ../../contracts/src/SmoothlyPoolMPT.sol:SmoothlyPoolMPT`
The contract can be found [here](https://github.com/Smoothly-Protocol/smoothly-contracts/blob/master/src/SmoothlyPoolMPT.sol).
3. Add in `.env` file the variable `ACC_WITH_VALIDATORS=` which should be the private key of an account
that owns one or more validators on goerli. Also, `VALIDATOR_INDEXES=[34560, 34561]` an array with the 
validator indexes.
4. `yarn test`
