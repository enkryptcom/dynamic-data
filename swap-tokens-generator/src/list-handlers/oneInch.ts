import { CHAIN_CONFIGS } from "@src/configs";
import { NetworkName, Token } from "@src/types";
import fetch from "node-fetch";

const ONEINCH_BASE = `https://partners.mewapi.io/oneinch/v5.2/`;

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
  NetworkName.ZkSync,
];

export default async (chainName: NetworkName): Promise<Record<string, Token>> =>
  fetch(`${ONEINCH_BASE}${CHAIN_CONFIGS[chainName].chainId}/tokens`)
    .then((res) => res.json())
    .then((_json) => {
      const json = _json as {
        tokens: Record<string, Token>;
      };
      const addresses = Object.keys(json.tokens);
      addresses.forEach((addr) => {
        json.tokens[addr].type = CHAIN_CONFIGS[chainName].type;
      });
      return json.tokens;
    });
