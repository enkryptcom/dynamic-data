import { ChainConfig, NetworkName, NetworkType } from "./types";

const CHAIN_CONFIGS: Record<NetworkName, ChainConfig> = {
  [NetworkName.Ethereum]: {
    chainId: "1",
    type: NetworkType.EVM,
    cgId: "ethereum",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
    name: "Ethereum",
    symbol: "ETH",
  },
  [NetworkName.Binance]: {
    chainId: "56",
    type: NetworkType.EVM,
    cgId: "binancecoin",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png",
    name: "BNB",
    symbol: "BNB",
  },
  [NetworkName.Matic]: {
    chainId: "137",
    type: NetworkType.EVM,
    cgId: "matic-network",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png",
    name: "MATIC",
    symbol: "MATIC",
  },
  [NetworkName.Optimism]: {
    chainId: "10",
    type: NetworkType.EVM,
    cgId: "ethereum",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
    name: "Ethereum",
    symbol: "ETH",
  },
  [NetworkName.Arbitrum]: {
    chainId: "42161",
    type: NetworkType.EVM,
    cgId: "ethereum",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
    name: "Ethereum",
    symbol: "ETH",
  },
  [NetworkName.Gnosis]: {
    chainId: "100",
    type: NetworkType.EVM,
    cgId: "dai",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png",
    name: "xDAI",
    symbol: "xDAI",
  },
  [NetworkName.Avalanche]: {
    chainId: "43114",
    type: NetworkType.EVM,
    cgId: "avalanche-2",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7.png",
    name: "Avalanche",
    symbol: "AVAX",
  },
  [NetworkName.Fantom]: {
    chainId: "250",
    type: NetworkType.EVM,
    cgId: "fantom",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x4e15361fd6b4bb609fa63c81a2be19d873717870.png",
    name: "Fantom Token",
    symbol: "FTM",
  },
  [NetworkName.Klaytn]: {
    chainId: "8217",
    type: NetworkType.EVM,
    cgId: "klay-token",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xe4f05a66ec68b54a58b17c22107b02e0232cc817.png",
    name: "Klaytn",
    symbol: "KLAY",
  },
  [NetworkName.Aurora]: {
    chainId: "1313161554",
    type: NetworkType.EVM,
    cgId: "ethereum",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
    name: "Ethereum",
    symbol: "ETH",
  },
  [NetworkName.EthereumClassic]: {
    chainId: "61",
    type: NetworkType.EVM,
    cgId: "ethereum-classic",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/453/thumb/ethereum-classic-logo.png",
    name: "Ethereum Classic",
    symbol: "ETC",
  },
  [NetworkName.Moonbeam]: {
    chainId: "1284",
    type: NetworkType.EVM,
    cgId: "moonbeam",
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/22459/thumb/glmr.png",
    name: "Moonbeam",
    symbol: "GLMR",
  },
  [NetworkName.ZkSync]: {
    chainId: "324",
    type: NetworkType.EVM,
    cgId: "ethereum",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
    name: "Ethereum",
    symbol: "ETH",
  },
  [NetworkName.Base]: {
    chainId: "8453",
    type: NetworkType.EVM,
    cgId: "ethereum",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
    name: "Ethereum",
    symbol: "ETH",
  },
  [NetworkName.MaticZK]: {
    chainId: "1101",
    type: NetworkType.EVM,
    cgId: "ethereum",
    decimals: 18,
    logoURI:
      "https://tokens.1inch.io/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png",
    name: "Ethereum",
    symbol: "ETH",
  },
  [NetworkName.Solana]: {
    chainId: "900",
    type: NetworkType.Solana,
    cgId: "solana",
    decimals: 9,
    logoURI:
      "https://assets.coingecko.com/coins/images/4128/standard/solana.png",
    name: "Solana",
    symbol: "SOL",
  },
  [NetworkName.Rootstock]: {
    chainId: "30",
    type: NetworkType.EVM,
    cgId: "rootstock",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/5070/standard/RBTC-logo.png",
    name: "Rootstock Smart Bitcoin",
    symbol: "RBTC",
  },
  [NetworkName.Telos]: {
    chainId: "40",
    type: NetworkType.EVM,
    cgId: "telos",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/7588/standard/tlos_png.png",
    name: "Telos",
    symbol: "tlos",
  },
  [NetworkName.Blast]: {
    chainId: "81457",
    type: NetworkType.EVM,
    cgId: "ethereum",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/35494/standard/Blast.jpg",
    name: "Ethereum",
    symbol: "ETH",
  },
};

const NATIVE_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export { CHAIN_CONFIGS, NATIVE_ADDRESS };
