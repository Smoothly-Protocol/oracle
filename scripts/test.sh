#!/usr/bin/env bash
echo $1
echo "Starting anvil as private network..."
anvil > /dev/null 2>&1 &
sleep 3
echo "Anvil is running correctly on http://127.0.0.1:8545";
NODE_NO_WARNINGS=1 mocha -r ts-node/register 'test/**.t.ts' "$@"
echo "killing anvil process"
pid=$(ps | grep anvil | awk '{print $1}')
kill $pid
