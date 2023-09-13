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
Copy and paste the above into the system file, replace YOUR USERNAME and YOUR_PRIVATE_KEY
```
sudo systemctl daemon-reload
```
Reload service
```
sudo systemctl enable smoothly
```
Enable smoothly to autoboot on restart
```
sudo systemctl start smoothly
```
start service
```
sudo journalctl -fu smoothly
```
check logs to verify connections

## Update the smoothly cli
```
sudo systemctl stop smoothly
```
Stop the service
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
sudo systemctl start smoothly
```
Start smoothly service

### Smoothly Oracle Docker Installation Guide
Step 1: Update Your System
Update your system package list to ensure you have the latest repository information:
```
sudo apt update
```
Step 2: Install Docker and Docker Compose
Download the Docker installation script and execute it to install Docker:
```
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```
Next, install Docker Compose by downloading the latest version and making it executable:
```
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```
To verify the installation of Docker and Docker Compose, use the following commands:
```
docker --version
docker-compose --version
```

Step 3: Pull the Docker Image
Pull the latest version of your Docker image from GitHub:
```
docker pull ghcr.io/smoothly-protocol/oracle:latest
```
Step 4: Run the Docker Container in Detached Mode
Run the Docker container in detached mode with the name "smoothlyoracle". Replace <your private key>, <your beacon client>, and <your EL client> with the appropriate values for your setup:
```
docker run -d --name=smoothlyoracle ghcr.io/smoothly-protocol/oracle:latest smoothly_cli -pk <your private key> -n goerli -b <your beacon client> -eth1 <your EL client>
```

Step 5: View Logs
To view the logs of the running container, use the docker logs command followed by the container name:
```
docker logs -f smoothlyoracle
```
## Usage 
`smoothly_cli -pk <YOUR_PRIVATE_KEY> -n <goerli defaults> -b <beacon api> -eth1 <your EL client> `

## Tests 

In order to run tests, the following configuration is needed:  
1. Local network: `anvil`, install if necessary.
2. `yarn test`
