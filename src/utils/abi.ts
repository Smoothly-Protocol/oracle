export const ABI = [
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
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "eth1_addr",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "pubKey",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "StakeAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "validator",
        "type": "string"
      }
    ],
    "name": "ValidatorDeactivated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "eth1_addr",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "validator",
        "type": "string"
      }
    ],
    "name": "ValidatorRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "eth1_addr",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "pubKey",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Withdrawal",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "EPOCH",
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
    "name": "ROOT",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
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
            "internalType": "bytes[]",
            "name": "proof",
            "type": "bytes[]"
          },
          {
            "internalType": "bytes",
            "name": "expectedValue",
            "type": "bytes"
          }
        ],
        "internalType": "struct SmoothlyPoolMPT.ProofData",
        "name": "data",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "pubKey",
        "type": "bytes"
      }
    ],
    "name": "addStake",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes[]",
            "name": "proof",
            "type": "bytes[]"
          },
          {
            "internalType": "bytes",
            "name": "expectedValue",
            "type": "bytes"
          }
        ],
        "internalType": "struct SmoothlyPoolMPT.ProofData",
        "name": "data",
        "type": "tuple"
      },
      {
        "internalType": "bytes[]",
        "name": "pubKeys",
        "type": "bytes[]"
      }
    ],
    "name": "exit",
    "outputs": [],
    "stateMutability": "nonpayable",
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
        "internalType": "bytes[]",
        "name": "pubKeys",
        "type": "bytes[]"
      }
    ],
    "name": "registerBulk",
    "outputs": [],
    "stateMutability": "payable",
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
        "internalType": "bytes[]",
        "name": "pubKeys",
        "type": "bytes[]"
      }
    ],
    "name": "reqExit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_root",
        "type": "bytes32"
      }
    ],
    "name": "setROOT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalStake",
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
        "components": [
          {
            "internalType": "bytes32",
            "name": "expectedRoot",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "key",
            "type": "bytes"
          },
          {
            "internalType": "bytes[]",
            "name": "proof",
            "type": "bytes[]"
          },
          {
            "internalType": "uint256",
            "name": "keyIndex",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "proofIndex",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "expectedValue",
            "type": "bytes"
          }
        ],
        "internalType": "struct MPTVerifier.MerkleProof",
        "name": "data",
        "type": "tuple"
      }
    ],
    "name": "verifyProof",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes[]",
            "name": "proof",
            "type": "bytes[]"
          },
          {
            "internalType": "bytes",
            "name": "expectedValue",
            "type": "bytes"
          }
        ],
        "internalType": "struct SmoothlyPoolMPT.ProofData",
        "name": "data",
        "type": "tuple"
      }
    ],
    "name": "withdrawRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];
