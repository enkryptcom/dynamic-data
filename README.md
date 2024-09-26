# Dynamicly generated data for Enkrypt

Swap and Dapp data for the [Enkrypt Multichain Browser Wallet Extension](https://github.com/enkryptcom/enKrypt).

GitHub actions generates token lists every 60 minutes. See `./swaplists/`.

DAPPS are updated via pull requests. See `./dapps/`.

You can generate token lists locally by running the npm script `update:lists` in the `./swap-tokens-generator` codebase.

## Swap lists

The `./swaplists/` directory contains JSON files with arrays of tokens. Each chain that Enkrypt supports swaps on has its own file.

There are also some extra files for other generated data that helps with swaps on Enkrypt, such as top CoinGecko tokens and Changelly tokens.

These files are used by Enkrypt to help find swappable tokens and provide extra info and pricing data about tokens.

```
- swaplists/
  | ARB.json
    | ETH: address, decimals, logo, name, ...
    | GAME: ...
    | 0XBTX: ...
    | ...
  | AURORA.json
    | ETH: address, decimals, logo, name, ...
    | 0XMR: ...
    | ALM: ...
    | ...
  | AVAX.json
    | AVAX: address, decimals, logo, name, ...
    | ZERO: ...
    | BIOS: ...
  | ...
  | zkSync.json
    | ETH: address, decimals, logo, name, ...
    | BEL: ...
    | cBETH: ...
    | BIOS: ...
```

## Requirements

NodeJS `v20.17.0` is required to build and run the code that generates swap lists. If using [`nvm`](https://github.com/nvm-sh/nvm) you can target the version in `./swap-tokens-generateor/.nvmrc`.

Yarn version 1 must be installed globally.

## Getting started

```sh
# CLone the repo
git clone https://github.com/enkryptcom/dynamic-data

# Move to the codebase directory
cd swap-tokens-generator

# Make sure NodeJS v20.17.0 is installed and ready

# If you have nvm installed:
nvm use

# Make sure Yarn version 1 is installed

# Install dependencies
yarn install

# Build the source
yarn build

# Run the swap list generator
yarn update:lists

# This will populate ./dist/lists with .json files
```

