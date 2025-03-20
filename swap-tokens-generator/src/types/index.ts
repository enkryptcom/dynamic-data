/**
 * Must match network names in Enkrypt because used in .json filenames
 */
export enum NetworkName {
  Ethereum = "ETH",
  EthereumClassic = "ETC",
  Binance = "BNB",
  Matic = "MATIC",
  Optimism = "OP",
  Arbitrum = "ARB",
  Gnosis = "GNO",
  Avalanche = "AVAX",
  Fantom = "FTM",
  Kaia = "KAIA",
  Aurora = "AURORA",
  Moonbeam = "GLMR",
  ZkSync = "zkSync",
  Base = "BASE",
  MaticZK = "MATICZK",
  Solana = "SOLANA",
  Rootstock = "Rootstock",
  Telos = "TLOS",
  Blast = "blast",
}

export enum NetworkType {
  EVM = "evm",
  Substrate = "substrate",
  Bitcoin = "bitcoin",
  Solana = "solana",
}

export interface ChainConfig {
  chainId: string;
  type: NetworkType;
  cgId: string;
  logoURI: string;
  decimals: number;
  symbol: string;
  name: string;
}

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  logoURI?: string; // Some CoinGecko tokens have undefined logoURI
  type: NetworkType;
  rank?: number;
  cgId?: string;
  price?: number;
}
