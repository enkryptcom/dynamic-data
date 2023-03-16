import { ChainConfig, NetworkName, NetworkType } from "./types";

const CHAIN_CONFIGS: Record<NetworkName, ChainConfig> = {
  [NetworkName.Ethereum]: {
    chainId: "1",
    type: NetworkType.EVM,
  },
  [NetworkName.Binance]: {
    chainId: "56",
    type: NetworkType.EVM,
  },
  [NetworkName.Matic]: {
    chainId: "137",
    type: NetworkType.EVM,
  },
  [NetworkName.Optimism]: {
    chainId: "10",
    type: NetworkType.EVM,
  },
  [NetworkName.Arbitrum]: {
    chainId: "42161",
    type: NetworkType.EVM,
  },
  [NetworkName.Gnosis]: {
    chainId: "100",
    type: NetworkType.EVM,
  },
  [NetworkName.Avalanche]: {
    chainId: "43114",
    type: NetworkType.EVM,
  },
  [NetworkName.Fantom]: {
    chainId: "250",
    type: NetworkType.EVM,
  },
  [NetworkName.Klaytn]: {
    chainId: "8217",
    type: NetworkType.EVM,
  },
  [NetworkName.Aurora]: {
    chainId: "1313161554",
    type: NetworkType.EVM,
  },
};

const NATIVE_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export { CHAIN_CONFIGS, NATIVE_ADDRESS };
