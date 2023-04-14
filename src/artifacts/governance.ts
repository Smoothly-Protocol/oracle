export const governance = {
  "_format": "hh-sol-artifact-1",
  "contractName": "PoolGovernance",
  "sourceName": "src/PoolGovernance.sol",
  "abi": [
    {
      "inputs": [
        {
          "internalType": "address payable",
          "name": "_pool",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "EpochTimelockNotReached",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "ExistingOperator",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "Unauthorized",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "_operators",
          "type": "address[]"
        }
      ],
      "name": "addOperators",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "_operators",
          "type": "address[]"
        }
      ],
      "name": "deleteOperators",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "epochInterval",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "epochNumber",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getOperators",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "getRewards",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "isOperator",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "lastEpoch",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "operatorRewards",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "operators",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "bytes32",
              "name": "withdrawals",
              "type": "bytes32"
            },
            {
              "internalType": "bytes32",
              "name": "exits",
              "type": "bytes32"
            },
            {
              "internalType": "bytes32",
              "name": "state",
              "type": "bytes32"
            },
            {
              "internalType": "uint256",
              "name": "fee",
              "type": "uint256"
            }
          ],
          "internalType": "struct PoolGovernance.Epoch",
          "name": "epoch",
          "type": "tuple"
        }
      ],
      "name": "proposeEpoch",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "votes",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "withdrawals",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "exits",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "state",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "fee",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "votingRatio",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "withdrawRewards",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ],
  "bytecode": "0x60a060405260006001553480156200001657600080fd5b5060405162001ffd38038062001ffd83398181016040528101906200003c9190620001d4565b6200005c620000506200009e60201b60201c565b620000a660201b60201c565b426002819055508073ffffffffffffffffffffffffffffffffffffffff1660808173ffffffffffffffffffffffffffffffffffffffff16815250505062000206565b600033905090565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006200019c826200016f565b9050919050565b620001ae816200018f565b8114620001ba57600080fd5b50565b600081519050620001ce81620001a3565b92915050565b600060208284031215620001ed57620001ec6200016a565b5b6000620001fd84828501620001bd565b91505092915050565b608051611dd462000229600039600081816101090152610b4d0152611dd46000f3fe6080604052600436106101025760003560e01c80638da5cb5b11610095578063c7b8981c11610064578063c7b8981c146103b3578063d23254b4146103ca578063e28d49061461040a578063f2fde38b14610447578063f4145a83146104705761018e565b80638da5cb5b1461030b5780639bc66c4614610336578063a07aea1c14610361578063bee077cd1461038a5761018e565b806341a2b8d6116100d157806341a2b8d61461023d5780636d70f7ae1461027a578063715018a6146102b757806379ee54f7146102ce5761018e565b806306a4c9831461019357806309b1ef26146101be5780630c2d3b9b146101e957806327a099d8146102125761018e565b3661018e577f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461018c576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b005b600080fd5b34801561019f57600080fd5b506101a861049b565b6040516101b59190611383565b60405180910390f35b3480156101ca57600080fd5b506101d36104a1565b6040516101e09190611383565b60405180910390f35b3480156101f557600080fd5b50610210600480360381019061020b9190611569565b6104a8565b005b34801561021e57600080fd5b50610227610568565b6040516102349190611670565b60405180910390f35b34801561024957600080fd5b50610264600480360381019061025f9190611692565b6105f6565b6040516102719190611383565b60405180910390f35b34801561028657600080fd5b506102a1600480360381019061029c9190611692565b61060e565b6040516102ae91906116da565b60405180910390f35b3480156102c357600080fd5b506102cc61062e565b005b3480156102da57600080fd5b506102f560048036038101906102f09190611692565b610642565b6040516103029190611383565b60405180910390f35b34801561031757600080fd5b5061032061068b565b60405161032d9190611704565b60405180910390f35b34801561034257600080fd5b5061034b6106b4565b6040516103589190611383565b60405180910390f35b34801561036d57600080fd5b5061038860048036038101906103839190611569565b6106b9565b005b34801561039657600080fd5b506103b160048036038101906103ac91906117fe565b610896565b005b3480156103bf57600080fd5b506103c8610c39565b005b3480156103d657600080fd5b506103f160048036038101906103ec919061182b565b610d21565b604051610401949392919061187a565b60405180910390f35b34801561041657600080fd5b50610431600480360381019061042c91906118bf565b610d5e565b60405161043e9190611704565b60405180910390f35b34801561045357600080fd5b5061046e60048036038101906104699190611692565b610d9d565b005b34801561047c57600080fd5b50610485610e20565b6040516104929190611383565b60405180910390f35b60025481565b6201518081565b6104b0610e26565b60005b8151811015610564576000600460008484815181106104d5576104d46118ec565b5b602002602001015173ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff021916908315150217905550610551828281518110610544576105436118ec565b5b6020026020010151610ea4565b808061055c9061194a565b9150506104b3565b5050565b606060038054806020026020016040519081016040528092919081815260200182805480156105ec57602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190600101908083116105a2575b5050505050905090565b60056020528060005260406000206000915090505481565b60046020528060005260406000206000915054906101000a900460ff1681565b610636610e26565b6106406000611070565b565b6000600560008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b604281565b6106c1610e26565b60005b815181101561089257600460008383815181106106e4576106e36118ec565b5b602002602001015173ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16156107905781818151811061074c5761074b6118ec565b5b60200260200101516040517f3a8fff410000000000000000000000000000000000000000000000000000000081526004016107879190611704565b60405180910390fd5b6001600460008484815181106107a9576107a86118ec565b5b602002602001015173ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055506003828281518110610817576108166118ec565b5b60200260200101519080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550808061088a9061194a565b9150506106c4565b5050565b600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16610919576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6201518060025461092a9190611992565b421015610963576040517fa6339a8600000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8060066000600154815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082015181600001556020820151816001015560408201518160020155606082015181600301559050506000806003805480602002602001604051908101604052809291908181526020018280548015610a6657602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019060010190808311610a1c575b5050505050905060005b8151811015610c335760006006600060015481526020019081526020016000206000848481518110610aa557610aa46118ec565b5b602002602001015173ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206040518060800160405290816000820154815260200160018201548152602001600282015481526020016003820154815250509050610b268186611134565b15610b3b57600184610b389190611992565b93505b6042610b468561119d565b10610c1f577f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff16631cf1c52886600001518760200151886040015189606001516040518563ffffffff1660e01b8152600401610bba949392919061187a565b600060405180830381600087803b158015610bd457600080fd5b505af1158015610be8573d6000803e3d6000fd5b50505050610bfa8560600151846111c3565b60016000815480929190610c0d9061194a565b91905055504260028190555050610c33565b508080610c2b9061194a565b915050610a70565b50505050565b600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16610cbc576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60003390506000610ccc82610642565b90506000600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550610d1d8282611269565b5050565b6006602052816000526040600020602052806000526040600020600091509150508060000154908060010154908060020154908060030154905084565b60038181548110610d6e57600080fd5b906000526020600020016000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b610da5610e26565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603610e14576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610e0b90611a49565b60405180910390fd5b610e1d81611070565b50565b60015481565b610e2e611362565b73ffffffffffffffffffffffffffffffffffffffff16610e4c61068b565b73ffffffffffffffffffffffffffffffffffffffff1614610ea2576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610e9990611ab5565b60405180910390fd5b565b60006003805480602002602001604051908101604052809291908181526020018280548015610f2857602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019060010190808311610ede575b5050505050905060005b815181101561106b578273ffffffffffffffffffffffffffffffffffffffff16828281518110610f6557610f646118ec565b5b602002602001015173ffffffffffffffffffffffffffffffffffffffff1603611058578160018351610f979190611ad5565b81518110610fa857610fa76118ec565b5b602002602001015160038281548110610fc457610fc36118ec565b5b9060005260206000200160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600380548061101e5761101d611b09565b5b6001900381819060005260206000200160006101000a81549073ffffffffffffffffffffffffffffffffffffffff0219169055905561106b565b80806110639061194a565b915050610f32565b505050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b6000816040516020016111479190611bab565b604051602081830303815290604052805190602001208360405160200161116e9190611bab565b60405160208183030381529060405280519060200120036111925760019050611197565b600090505b92915050565b60006003805490506064836111b29190611bc6565b6111bc9190611c4f565b9050919050565b60008151836111d29190611c4f565b905060005b82518110156112635781600560008584815181106111f8576111f76118ec565b5b602002602001015173ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546112499190611992565b92505081905550808061125b9061194a565b9150506111d7565b50505050565b600081116112ac576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016112a390611ccc565b60405180910390fd5b60008273ffffffffffffffffffffffffffffffffffffffff16826108fc906040516112d690611d1d565b600060405180830381858888f193505050503d8060008114611314576040519150601f19603f3d011682016040523d82523d6000602084013e611319565b606091505b505090508061135d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161135490611d7e565b60405180910390fd5b505050565b600033905090565b6000819050919050565b61137d8161136a565b82525050565b60006020820190506113986000830184611374565b92915050565b6000604051905090565b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b611400826113b7565b810181811067ffffffffffffffff8211171561141f5761141e6113c8565b5b80604052505050565b600061143261139e565b905061143e82826113f7565b919050565b600067ffffffffffffffff82111561145e5761145d6113c8565b5b602082029050602081019050919050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061149f82611474565b9050919050565b6114af81611494565b81146114ba57600080fd5b50565b6000813590506114cc816114a6565b92915050565b60006114e56114e084611443565b611428565b905080838252602082019050602084028301858111156115085761150761146f565b5b835b81811015611531578061151d88826114bd565b84526020840193505060208101905061150a565b5050509392505050565b600082601f8301126115505761154f6113b2565b5b81356115608482602086016114d2565b91505092915050565b60006020828403121561157f5761157e6113a8565b5b600082013567ffffffffffffffff81111561159d5761159c6113ad565b5b6115a98482850161153b565b91505092915050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b6115e781611494565b82525050565b60006115f983836115de565b60208301905092915050565b6000602082019050919050565b600061161d826115b2565b61162781856115bd565b9350611632836115ce565b8060005b8381101561166357815161164a88826115ed565b975061165583611605565b925050600181019050611636565b5085935050505092915050565b6000602082019050818103600083015261168a8184611612565b905092915050565b6000602082840312156116a8576116a76113a8565b5b60006116b6848285016114bd565b91505092915050565b60008115159050919050565b6116d4816116bf565b82525050565b60006020820190506116ef60008301846116cb565b92915050565b6116fe81611494565b82525050565b600060208201905061171960008301846116f5565b92915050565b600080fd5b6000819050919050565b61173781611724565b811461174257600080fd5b50565b6000813590506117548161172e565b92915050565b6117638161136a565b811461176e57600080fd5b50565b6000813590506117808161175a565b92915050565b60006080828403121561179c5761179b61171f565b5b6117a66080611428565b905060006117b684828501611745565b60008301525060206117ca84828501611745565b60208301525060406117de84828501611745565b60408301525060606117f284828501611771565b60608301525092915050565b600060808284031215611814576118136113a8565b5b600061182284828501611786565b91505092915050565b60008060408385031215611842576118416113a8565b5b600061185085828601611771565b9250506020611861858286016114bd565b9150509250929050565b61187481611724565b82525050565b600060808201905061188f600083018761186b565b61189c602083018661186b565b6118a9604083018561186b565b6118b66060830184611374565b95945050505050565b6000602082840312156118d5576118d46113a8565b5b60006118e384828501611771565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006119558261136a565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82036119875761198661191b565b5b600182019050919050565b600061199d8261136a565b91506119a88361136a565b92508282019050808211156119c0576119bf61191b565b5b92915050565b600082825260208201905092915050565b7f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160008201527f6464726573730000000000000000000000000000000000000000000000000000602082015250565b6000611a336026836119c6565b9150611a3e826119d7565b604082019050919050565b60006020820190508181036000830152611a6281611a26565b9050919050565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572600082015250565b6000611a9f6020836119c6565b9150611aaa82611a69565b602082019050919050565b60006020820190508181036000830152611ace81611a92565b9050919050565b6000611ae08261136a565b9150611aeb8361136a565b9250828203905081811115611b0357611b0261191b565b5b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603160045260246000fd5b611b4181611724565b82525050565b611b508161136a565b82525050565b608082016000820151611b6c6000850182611b38565b506020820151611b7f6020850182611b38565b506040820151611b926040850182611b38565b506060820151611ba56060850182611b47565b50505050565b6000608082019050611bc06000830184611b56565b92915050565b6000611bd18261136a565b9150611bdc8361136a565b9250817fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0483118215151615611c1557611c1461191b565b5b828202905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b6000611c5a8261136a565b9150611c658361136a565b925082611c7557611c74611c20565b5b828204905092915050565b7f4163636f756e742062616c616e63652069732030000000000000000000000000600082015250565b6000611cb66014836119c6565b9150611cc182611c80565b602082019050919050565b60006020820190508181036000830152611ce581611ca9565b9050919050565b600081905092915050565b50565b6000611d07600083611cec565b9150611d1282611cf7565b600082019050919050565b6000611d2882611cfa565b9150819050919050565b7f4661696c656420746f2073656e64204574686572000000000000000000000000600082015250565b6000611d686014836119c6565b9150611d7382611d32565b602082019050919050565b60006020820190508181036000830152611d9781611d5b565b905091905056fea26469706673582212200d1204445a37a94efba4134f44cd96bc7297a1a35d05c47dff2eb11228cd741a64736f6c63430008100033",
  "deployedBytecode": "0x6080604052600436106101025760003560e01c80638da5cb5b11610095578063c7b8981c11610064578063c7b8981c146103b3578063d23254b4146103ca578063e28d49061461040a578063f2fde38b14610447578063f4145a83146104705761018e565b80638da5cb5b1461030b5780639bc66c4614610336578063a07aea1c14610361578063bee077cd1461038a5761018e565b806341a2b8d6116100d157806341a2b8d61461023d5780636d70f7ae1461027a578063715018a6146102b757806379ee54f7146102ce5761018e565b806306a4c9831461019357806309b1ef26146101be5780630c2d3b9b146101e957806327a099d8146102125761018e565b3661018e577f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461018c576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b005b600080fd5b34801561019f57600080fd5b506101a861049b565b6040516101b59190611383565b60405180910390f35b3480156101ca57600080fd5b506101d36104a1565b6040516101e09190611383565b60405180910390f35b3480156101f557600080fd5b50610210600480360381019061020b9190611569565b6104a8565b005b34801561021e57600080fd5b50610227610568565b6040516102349190611670565b60405180910390f35b34801561024957600080fd5b50610264600480360381019061025f9190611692565b6105f6565b6040516102719190611383565b60405180910390f35b34801561028657600080fd5b506102a1600480360381019061029c9190611692565b61060e565b6040516102ae91906116da565b60405180910390f35b3480156102c357600080fd5b506102cc61062e565b005b3480156102da57600080fd5b506102f560048036038101906102f09190611692565b610642565b6040516103029190611383565b60405180910390f35b34801561031757600080fd5b5061032061068b565b60405161032d9190611704565b60405180910390f35b34801561034257600080fd5b5061034b6106b4565b6040516103589190611383565b60405180910390f35b34801561036d57600080fd5b5061038860048036038101906103839190611569565b6106b9565b005b34801561039657600080fd5b506103b160048036038101906103ac91906117fe565b610896565b005b3480156103bf57600080fd5b506103c8610c39565b005b3480156103d657600080fd5b506103f160048036038101906103ec919061182b565b610d21565b604051610401949392919061187a565b60405180910390f35b34801561041657600080fd5b50610431600480360381019061042c91906118bf565b610d5e565b60405161043e9190611704565b60405180910390f35b34801561045357600080fd5b5061046e60048036038101906104699190611692565b610d9d565b005b34801561047c57600080fd5b50610485610e20565b6040516104929190611383565b60405180910390f35b60025481565b6201518081565b6104b0610e26565b60005b8151811015610564576000600460008484815181106104d5576104d46118ec565b5b602002602001015173ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff021916908315150217905550610551828281518110610544576105436118ec565b5b6020026020010151610ea4565b808061055c9061194a565b9150506104b3565b5050565b606060038054806020026020016040519081016040528092919081815260200182805480156105ec57602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190600101908083116105a2575b5050505050905090565b60056020528060005260406000206000915090505481565b60046020528060005260406000206000915054906101000a900460ff1681565b610636610e26565b6106406000611070565b565b6000600560008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b604281565b6106c1610e26565b60005b815181101561089257600460008383815181106106e4576106e36118ec565b5b602002602001015173ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16156107905781818151811061074c5761074b6118ec565b5b60200260200101516040517f3a8fff410000000000000000000000000000000000000000000000000000000081526004016107879190611704565b60405180910390fd5b6001600460008484815181106107a9576107a86118ec565b5b602002602001015173ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055506003828281518110610817576108166118ec565b5b60200260200101519080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550808061088a9061194a565b9150506106c4565b5050565b600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16610919576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6201518060025461092a9190611992565b421015610963576040517fa6339a8600000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8060066000600154815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082015181600001556020820151816001015560408201518160020155606082015181600301559050506000806003805480602002602001604051908101604052809291908181526020018280548015610a6657602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019060010190808311610a1c575b5050505050905060005b8151811015610c335760006006600060015481526020019081526020016000206000848481518110610aa557610aa46118ec565b5b602002602001015173ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206040518060800160405290816000820154815260200160018201548152602001600282015481526020016003820154815250509050610b268186611134565b15610b3b57600184610b389190611992565b93505b6042610b468561119d565b10610c1f577f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff16631cf1c52886600001518760200151886040015189606001516040518563ffffffff1660e01b8152600401610bba949392919061187a565b600060405180830381600087803b158015610bd457600080fd5b505af1158015610be8573d6000803e3d6000fd5b50505050610bfa8560600151846111c3565b60016000815480929190610c0d9061194a565b91905055504260028190555050610c33565b508080610c2b9061194a565b915050610a70565b50505050565b600460003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16610cbc576040517f82b4290000000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60003390506000610ccc82610642565b90506000600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550610d1d8282611269565b5050565b6006602052816000526040600020602052806000526040600020600091509150508060000154908060010154908060020154908060030154905084565b60038181548110610d6e57600080fd5b906000526020600020016000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b610da5610e26565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603610e14576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610e0b90611a49565b60405180910390fd5b610e1d81611070565b50565b60015481565b610e2e611362565b73ffffffffffffffffffffffffffffffffffffffff16610e4c61068b565b73ffffffffffffffffffffffffffffffffffffffff1614610ea2576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610e9990611ab5565b60405180910390fd5b565b60006003805480602002602001604051908101604052809291908181526020018280548015610f2857602002820191906000526020600020905b8160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019060010190808311610ede575b5050505050905060005b815181101561106b578273ffffffffffffffffffffffffffffffffffffffff16828281518110610f6557610f646118ec565b5b602002602001015173ffffffffffffffffffffffffffffffffffffffff1603611058578160018351610f979190611ad5565b81518110610fa857610fa76118ec565b5b602002602001015160038281548110610fc457610fc36118ec565b5b9060005260206000200160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600380548061101e5761101d611b09565b5b6001900381819060005260206000200160006101000a81549073ffffffffffffffffffffffffffffffffffffffff0219169055905561106b565b80806110639061194a565b915050610f32565b505050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b6000816040516020016111479190611bab565b604051602081830303815290604052805190602001208360405160200161116e9190611bab565b60405160208183030381529060405280519060200120036111925760019050611197565b600090505b92915050565b60006003805490506064836111b29190611bc6565b6111bc9190611c4f565b9050919050565b60008151836111d29190611c4f565b905060005b82518110156112635781600560008584815181106111f8576111f76118ec565b5b602002602001015173ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546112499190611992565b92505081905550808061125b9061194a565b9150506111d7565b50505050565b600081116112ac576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016112a390611ccc565b60405180910390fd5b60008273ffffffffffffffffffffffffffffffffffffffff16826108fc906040516112d690611d1d565b600060405180830381858888f193505050503d8060008114611314576040519150601f19603f3d011682016040523d82523d6000602084013e611319565b606091505b505090508061135d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161135490611d7e565b60405180910390fd5b505050565b600033905090565b6000819050919050565b61137d8161136a565b82525050565b60006020820190506113986000830184611374565b92915050565b6000604051905090565b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b611400826113b7565b810181811067ffffffffffffffff8211171561141f5761141e6113c8565b5b80604052505050565b600061143261139e565b905061143e82826113f7565b919050565b600067ffffffffffffffff82111561145e5761145d6113c8565b5b602082029050602081019050919050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061149f82611474565b9050919050565b6114af81611494565b81146114ba57600080fd5b50565b6000813590506114cc816114a6565b92915050565b60006114e56114e084611443565b611428565b905080838252602082019050602084028301858111156115085761150761146f565b5b835b81811015611531578061151d88826114bd565b84526020840193505060208101905061150a565b5050509392505050565b600082601f8301126115505761154f6113b2565b5b81356115608482602086016114d2565b91505092915050565b60006020828403121561157f5761157e6113a8565b5b600082013567ffffffffffffffff81111561159d5761159c6113ad565b5b6115a98482850161153b565b91505092915050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b6115e781611494565b82525050565b60006115f983836115de565b60208301905092915050565b6000602082019050919050565b600061161d826115b2565b61162781856115bd565b9350611632836115ce565b8060005b8381101561166357815161164a88826115ed565b975061165583611605565b925050600181019050611636565b5085935050505092915050565b6000602082019050818103600083015261168a8184611612565b905092915050565b6000602082840312156116a8576116a76113a8565b5b60006116b6848285016114bd565b91505092915050565b60008115159050919050565b6116d4816116bf565b82525050565b60006020820190506116ef60008301846116cb565b92915050565b6116fe81611494565b82525050565b600060208201905061171960008301846116f5565b92915050565b600080fd5b6000819050919050565b61173781611724565b811461174257600080fd5b50565b6000813590506117548161172e565b92915050565b6117638161136a565b811461176e57600080fd5b50565b6000813590506117808161175a565b92915050565b60006080828403121561179c5761179b61171f565b5b6117a66080611428565b905060006117b684828501611745565b60008301525060206117ca84828501611745565b60208301525060406117de84828501611745565b60408301525060606117f284828501611771565b60608301525092915050565b600060808284031215611814576118136113a8565b5b600061182284828501611786565b91505092915050565b60008060408385031215611842576118416113a8565b5b600061185085828601611771565b9250506020611861858286016114bd565b9150509250929050565b61187481611724565b82525050565b600060808201905061188f600083018761186b565b61189c602083018661186b565b6118a9604083018561186b565b6118b66060830184611374565b95945050505050565b6000602082840312156118d5576118d46113a8565b5b60006118e384828501611771565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006119558261136a565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82036119875761198661191b565b5b600182019050919050565b600061199d8261136a565b91506119a88361136a565b92508282019050808211156119c0576119bf61191b565b5b92915050565b600082825260208201905092915050565b7f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160008201527f6464726573730000000000000000000000000000000000000000000000000000602082015250565b6000611a336026836119c6565b9150611a3e826119d7565b604082019050919050565b60006020820190508181036000830152611a6281611a26565b9050919050565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572600082015250565b6000611a9f6020836119c6565b9150611aaa82611a69565b602082019050919050565b60006020820190508181036000830152611ace81611a92565b9050919050565b6000611ae08261136a565b9150611aeb8361136a565b9250828203905081811115611b0357611b0261191b565b5b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603160045260246000fd5b611b4181611724565b82525050565b611b508161136a565b82525050565b608082016000820151611b6c6000850182611b38565b506020820151611b7f6020850182611b38565b506040820151611b926040850182611b38565b506060820151611ba56060850182611b47565b50505050565b6000608082019050611bc06000830184611b56565b92915050565b6000611bd18261136a565b9150611bdc8361136a565b9250817fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0483118215151615611c1557611c1461191b565b5b828202905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b6000611c5a8261136a565b9150611c658361136a565b925082611c7557611c74611c20565b5b828204905092915050565b7f4163636f756e742062616c616e63652069732030000000000000000000000000600082015250565b6000611cb66014836119c6565b9150611cc182611c80565b602082019050919050565b60006020820190508181036000830152611ce581611ca9565b9050919050565b600081905092915050565b50565b6000611d07600083611cec565b9150611d1282611cf7565b600082019050919050565b6000611d2882611cfa565b9150819050919050565b7f4661696c656420746f2073656e64204574686572000000000000000000000000600082015250565b6000611d686014836119c6565b9150611d7382611d32565b602082019050919050565b60006020820190508181036000830152611d9781611d5b565b905091905056fea26469706673582212200d1204445a37a94efba4134f44cd96bc7297a1a35d05c47dff2eb11228cd741a64736f6c63430008100033",
  "linkReferences": {},
  "deployedLinkReferences": {}
}

