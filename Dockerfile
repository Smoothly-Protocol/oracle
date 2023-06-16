# Start from a base image
FROM node:18.16.0-alpine

# Install essential libraries and tools
RUN apk update && \
    apk add --no-cache build-base libssl1.1 curl git bash

# Set the working directory
WORKDIR /usr/bin/app

# Clone the repository
RUN git clone -b p2p_implementation https://github.com/Smoothly-Protocol/oracle.git .

# Build and link
RUN npm install && \
    npm run build && \
    npm link

#RUN chmod +x ./scripts/start.sh

# Expose port 4040
EXPOSE 4040

# Command to run
ENTRYPOINT ["node", "--experimental-specifier-resolution=node", "./dist/index.js"]
