#!/usr/bin/env bash
DIR="$( dirname -- "$( readlink -f -- "$0"; )"; )"
exec node --experimental-specifier-resolution=node $DIR/../dist/index.js "$@"
