import { ChainConfig, NetworkName, NetworkType } from "./types";

const CHAIN_CONFIGS: Record<NetworkName, ChainConfig> = {
  [NetworkName.Ethereum]: {
    chainId: "1",
    type: NetworkType.EVM,
    cgId: "ethereum",
  },
  [NetworkName.Binance]: {
    chainId: "56",
    type: NetworkType.EVM,
    cgId: "binancecoin",
  },
  [NetworkName.Matic]: {
    chainId: "137",
    type: NetworkType.EVM,
    cgId: "matic-network",
  },
  [NetworkName.Optimism]: {
    chainId: "10",
    type: NetworkType.EVM,
    cgId: "optimism",
  },
  [NetworkName.Arbitrum]: {
    chainId: "42161",
    type: NetworkType.EVM,
    cgId: "ethereum",
  },
  [NetworkName.Gnosis]: {
    chainId: "100",
    type: NetworkType.EVM,
    cgId: "dai",
  },
  [NetworkName.Avalanche]: {
    chainId: "43114",
    type: NetworkType.EVM,
    cgId: "avalanche-2",
  },
  [NetworkName.Fantom]: {
    chainId: "250",
    type: NetworkType.EVM,
    cgId: "fantom",
  },
  [NetworkName.Klaytn]: {
    chainId: "8217",
    type: NetworkType.EVM,
    cgId: "klay-token",
  },
  [NetworkName.Aurora]: {
    chainId: "1313161554",
    type: NetworkType.EVM,
    cgId: "ethereum",
  },
  [NetworkName.EthereumClassic]: {
    chainId: "61",
    type: NetworkType.EVM,
    cgId: "ethereum-classic",
  },
};

const NATIVE_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export { CHAIN_CONFIGS, NATIVE_ADDRESS };
