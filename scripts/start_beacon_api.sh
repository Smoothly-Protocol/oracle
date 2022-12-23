touch geth.log
touch beacon.log
geth --goerli --http --datadir ~/.ethereum/goerli/ -pprof >> geth.log 2>&1 &
lighthouse bn --network prater --http --execution-endpoint http://127.0.0.1:8551 --execution-jwt ~/.ethereum/goerli/geth/jwtsecret --checkpoint-sync-url https://goerli.checkpoint-sync.ethdevops.io --purge-db >> beacon.log 2>&1 &
