<p align="center"><a href="https://0xsmoothly.notion.site/"><img width="300" title="Smoothly" src='assets/web_logo.png' /></a></p>

# Smoothly Pool Operator Node

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/Smoothly-Protocol/oracle?label=Github)](https://github.com/Smoothly-Protocol/oracle/releases)
![ES Version](https://img.shields.io/badge/ES-2020-yellow)
![Node Version](https://img.shields.io/badge/node-18.x-green)

## Prerequisites

- :gear: [NodeJS](https://nodejs.org/) (LTS)
- :toolbox: [Yarn](https://yarnpkg.com/)/[npm](https://npmjs.com/)

## Getting Started 

To start git clone the repository and `cd` into it.

### Docker

```
docker build -t smoothly .
docker run -d -e "PK=APPROVED_OPERATOR_ETH1_PRIVATE_KEY" smoothly
```

### Source Build

```
sudo apt update
sudo apt install build-essential libssl-dev curl
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc
nvm --version
nvm ls-remote
nvm install v18.16.0
sudo apt install git
git clone https://github.com/Smoothly-Protocol/oracle.git
cd oracle
npm run build
npm install typescript
npm run build
npm link
smoothly_cli -pk <your private key> -s https://node-goerli.smoothly.money -n goerli
```

## Usage 
`smoothly_cli -pk <YOUR_PRIVATE_KEY> -s <CHECKPOINT_NODE_SYNC> -n <goerli defaults>` 

## Tests 

In order to run tests, the following configuration is needed:  
1. Local network: `anvil`, install if necessary.
2. `yarn test`
