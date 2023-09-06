Dockerfile
----
# Start from a base image
FROM node:18.16.0-alpine

# Install essential libraries and tools
RUN apk update && \
    apk add --no-cache build-base libssl1.1 curl git bash

# Set the working directory
WORKDIR /usr/bin/app

# Clone the repository
#RUN git clone https://github.com/Smoothly-Protocol/oracle.git .

RUN git clone https://github.com/Smoothly-Protocol/oracle.git .

# Build and link
RUN npm install && \
    npm run build && \
    npm link

RUN chmod +x ./scripts/start.sh

# Expose port 4040
EXPOSE 4040

# Command to run
ENTRYPOINT ["node", "--experimental-specifier-resolution=node", "./dist/index.js"]

#To debug
#CMD ["sh", "-c", "sleep infinity"]
----
docker-compose.yaml - external BN provider
----
version: "3.5"
services:
  smoothly:
    stdin_open: true
    tty: true
    container_name: smoothly
    image: smoothly
    volumes:
      - <path/to/smoothly/data>:/root/.smoothly
    restart: unless-stopped
    ports:
      - "4040:4040"
    command: -pk <priv_key> -b http://<bn_api>:<port> -n goerli
    stop_grace_period: 1m
-----
docker-compose.yaml - using bridge networking, we connect between docker containers
-----
version: "3.5"
services:
  smoothly:
    stdin_open: true
    tty: true
    container_name: smoothly
    image: smoothly
    volumes:
      - <path/to/smoothly/data>:/root/.smoothly
    restart: unless-stopped
    ports:
      - "4040:4040"
    networks:
      - ethereum
    command: -pk <priv_key> -b http://<bn_container_name>:<port> -n goerli
    stop_grace_period: 1m

networks:
  ethereum:
    name: ethereum
    driver: bridge
-----
update.sh
-----
#!/bin/bash
docker stop smoothly
docker rm smoothly
docker build -t smoothly . --no-cache
docker compose up -d
---
chmod +x update.sh
