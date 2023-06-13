# syntax=docker/dockerfile:1

FROM node:18-alpine
WORKDIR /usr/bin/app
COPY . .
RUN npm install && npm run build
EXPOSE 4040
ENV PK="0x"
CMD ["sh", "-c", "node --experimental-specifier-resolution=node ./dist/index.js -pk ${PK} -s https://node-goerli.smoothly.money -n goerli"]
