<p align="center"><a href="https://0xsmoothly.notion.site/"><img width="300" title="Smoothly" src='assets/web_logo.png' /></a></p>

# Smoothly Pool Operator Node

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/Smoothly-Protocol/oracle?label=Github)](https://github.com/Smoothly-Protocol/oracle/releases)
![ES Version](https://img.shields.io/badge/ES-2020-yellow)
![Node Version](https://img.shields.io/badge/node-18.x-green)

## Prerequisites

- :gear: [NodeJS](https://nodejs.org/) (LTS)
- :toolbox: [Yarn](https://yarnpkg.com/)/[npm](https://npmjs.com/)

### Build from source

```
sudo apt update
```
Update your system
```
sudo apt install build-essential libssl-dev curl
```
Install essential libraries
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc
``` 
Install NVM
```
nvm install v18.16.0
```
Check version options and install v18.16.0
```
sudo apt install git
```
Install git if needed
```
git clone https://github.com/Smoothly-Protocol/oracle.git
```
Clone our repo
```
cd oracle
```
Move into the \oracle folder
```
git pull
```
make sure that branch is up to date
```
npm install
``` 
Insall any updates of npm
```
npm install typescript
```
Intstall typescript if prompted
```
npm run build
```
Build using npm
```
npm link
```
Link npm to smoothly cli
```
smoothly_cli -pk <your private key> -n goerli -b <your beacon client> -eth1 <your EL client>
```
Run the smoothly cli and enter the private key associated with the whitelisted address used to vote in the governance contract  
-n flag defines the network (goerli for now)  
-b flag identifies which beacon node api to connect to (ex. for prysm -b http://localhost:3500) by default we're using a public nimbus api  
-eth1 flag identifies which eth1 api to connet to (ex. for geth -eth1 http://localhost:8545) by default we're using an alchemy endpoint

## Create a Systemd Service File
```
sudo nano /etc/systemd/system/smoothly.service
```
Open a editable system file
```
[Unit]
Description=Smoothly CLI
After=network.target

[Service]
User=<YOUR USERNAME>
Group=<YOUR GROUPNAME>
WorkingDirectory=/home/<YOUR USERNAME>/oracle
ExecStart=/home/<YOUR USERNAME>/.nvm/versions/node/v18.16.0/bin/smoothly_cli -pk YOUR_PRIVATE_KEY -n goerli
Restart=always
Environment=PATH=/home/<YOUR USERNAME>/.nvm/versions/node/v18.16.0/bin:/usr/bin:/usr/local/bin

[Install]
WantedBy=multi-user.target
```

## Update the smoothly cli
```
cd oracle
```
Move into the oracle directory
```
git pull
```
Pull new changes 
```
npm run build
```
Build with new changes
```
npm link
```
Link 
```
smoothly_cli -pk <your private key> -n goerli
```
Start smoothly_cli

## Usage 
`smoothly_cli -pk <YOUR_PRIVATE_KEY> -n <goerli defaults>` 

## Tests 

In order to run tests, the following configuration is needed:  
1. Local network: `anvil`, install if necessary.
2. `yarn test`
