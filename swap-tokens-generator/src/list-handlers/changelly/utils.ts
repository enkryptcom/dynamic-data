import { NATIVE_ADDRESS } from "@src/configs";
import { NetworkName, NetworkType, Token } from "@src/types";

/**
 * (our internal) Network ID -> Changelly Blockchain ID
 *
 * Subset of networks that Changelly supports cross-chain swaps on.
 
 * If a network is not in this list then its tokens will be dropped from the
 * final json files outputs.
 *
 * ```sh
 * # List of all Changelly tokens
 * curl -sL https://partners.mewapi.io/changelly-v2 -X POST -H Accept:application/json -H Content-Type:application/json --data '{"id":"1","jsonrpc":"2.0","method":"getCurrenciesFull","params":{}}'
 *
 * # List of the most common Changelly token blockchains
 * curl -sL https://partners.mewapi.io/changelly-v2 -X POST -H Accept:application/json -H Content-Type:application/json --data '{"id":"1","jsonrpc":"2.0","method":"getCurrenciesFull","params":{}}' | jq .result[].blockchain -r | sort | uniq -c | sort -n | tail -n 30
 * #       1 zcash
 * #       1 zetachain
 * #       1 zilliqa
 * #       1 zklink
 * #       1 ZKSYNC
 * #       2 aurora
 * #       2 cardano
 * #       2 LINEA
 * #       2 liquid
 * #       2 near
 * #       2 ontology
 * #       2 polkadot
 * #       2 ripple
 * #       2 rootstock
 * #       2 stellar
 * #       2 sui
 * #       2 tezos
 * #       2 theta
 * #       3 neo
 * #       5 optimism
 * #       6 chiliz
 * #       8 BASE
 * #       8 ton
 * #      10 tron
 * #      12 avaxc
 * #      14 polygon
 * #      15 arbitrum
 * #      46 solana
 * #      64 binance_smart_chain
 * #     307 ethereum
 * ````
 */
const ChangellyPlatforms: {
  [key in NetworkName]?: string;
} = {
  [NetworkName.Ethereum]: "ethereum",
  [NetworkName.Matic]: "polygon",
  [NetworkName.Binance]: "binance_smart_chain",
  [NetworkName.EthereumClassic]: "ethereum_classic",
  [NetworkName.Avalanche]: "avaxc",
  [NetworkName.Kaia]: "kaia",
  [NetworkName.Optimism]: "optimism",
  [NetworkName.Moonbeam]: "glmr",
  [NetworkName.Base]: "BASE",
  [NetworkName.Rootstock]: "rootstock",
  [NetworkName.Solana]: "solana",
};

const ChangellyContractMap: {
  [key in NetworkName]?: Record<string, Lowercase<string>>;
} = {
  [NetworkName.Avalanche]: {
    gmx: "0x62edc0692bd897d2295872a9ffcac5425011c661",
    joe: "0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd",
    usdtavac: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7",
    usdcavac: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
    qi: "0x8729438eb15e2c8b576fcc6aecda6a148776c0f5",
  },
  [NetworkName.Moonbeam]: {
    glmr: NATIVE_ADDRESS,
  },
  [NetworkName.Optimism]: {
    op: "0x4200000000000000000000000000000000000042",
  },
};

// Used to override native tokens received from the Changelly API
const NativeTokens: Record<string, Token> = {
  dot: {
    address: NATIVE_ADDRESS,
    decimals: 10,
    logoURI:
      "https://assets.coingecko.com/coins/images/12171/thumb/polkadot.png",
    name: "Polkadot",
    symbol: "DOT",
    type: NetworkType.Substrate,
    cgId: "polkadot",
  },
  ksm: {
    address: NATIVE_ADDRESS,
    decimals: 12,
    logoURI:
      "https://assets.coingecko.com/coins/images/9568/thumb/m4zRhP5e_400x400.jpg",
    name: "Kusama",
    symbol: "ksm",
    type: NetworkType.Substrate,
    cgId: "kusama",
  },
  btc: {
    address: NATIVE_ADDRESS,
    decimals: 8,
    logoURI: "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png",
    name: "Bitcoin",
    symbol: "BTC",
    type: NetworkType.Bitcoin,
    cgId: "bitcoin",
  },
  ltc: {
    address: NATIVE_ADDRESS,
    decimals: 8,
    logoURI: "https://assets.coingecko.com/coins/images/2/thumb/litecoin.png",
    name: "Litecoin",
    symbol: "LTC",
    type: NetworkType.Bitcoin,
    cgId: "litecoin",
  },
  doge: {
    address: NATIVE_ADDRESS,
    decimals: 8,
    logoURI: "https://assets.coingecko.com/coins/images/5/thumb/dogecoin.png",
    name: "Dogecoin",
    symbol: "DOGE",
    type: NetworkType.Bitcoin,
    cgId: "dogecoin",
  },
  rbtc: {
    address: NATIVE_ADDRESS,
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/5070/thumb/rsk-logo.jpg?",
    name: "Rootstock RSK",
    symbol: "RBTC",
    type: NetworkType.EVM,
    cgId: "rootstock",
  },
};

export { ChangellyContractMap, ChangellyPlatforms, NativeTokens };
