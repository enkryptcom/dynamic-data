import { CHAIN_CONFIGS } from "@src/configs";
import { NetworkName, Token } from "@src/types";
import fetch from "node-fetch";

const ONEINCH_BASE = `https://api.1inch.io/v5.0/`;

export const supportedChains: NetworkName[] = [
  NetworkName.Ethereum,
  NetworkName.Binance,
  NetworkName.Matic,
  NetworkName.Optimism,
  NetworkName.Arbitrum,
  NetworkName.Gnosis,
  NetworkName.Avalanche,
  NetworkName.Fantom,
  NetworkName.Klaytn,
  NetworkName.Aurora,
];

export default async (chainName: NetworkName): Promise<Record<string, Token>> =>
  fetch(`${ONEINCH_BASE}${CHAIN_CONFIGS[chainName].chainId}/tokens`)
    .then((res) => res.json())
    .then((_json) => {
      const json = _json as {
        tokens: Record<string, Token>;
      };
      return json.tokens;
    });
