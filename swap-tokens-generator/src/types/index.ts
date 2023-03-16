export enum NetworkName {
  Ethereum = "ETH",
  Binance = "BNB",
  Matic = "MATIC",
  Optimism = "OP",
  Arbitrum = "ARB",
  Gnosis = "GNO",
  Avalanche = "AVAX",
  Fantom = "FTM",
  Klaytn = "KLAY",
  Aurora = "AURORA",
}

export enum NetworkType {
  EVM = "evm",
}

export interface ChainConfig {
  chainId: string;
  type: NetworkType;
}

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  logoURI: string;
}
