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
npm install 
npm run build
npm link
```

## Usage 
`smoothly_cli -pk <YOUR_PRIVATE_KEY> -s <CHECKPOINT_NODE_SYNC> -n <goerli defaults>` 

## Tests 

In order to run tests, the following configuration is needed:  
1. Local network: `anvil`, install if necessary.
2. `yarn test`
