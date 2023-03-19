echo "Starting anvil as private network..."
anvil > /dev/null 2>&1 &
sleep 6
echo "Anvil is running correctly on http://127.0.0.1:8545";
echo "Deploying smart contract...";
forge create --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 ./contracts/SmoothlyPool.sol:SmoothlyPool

