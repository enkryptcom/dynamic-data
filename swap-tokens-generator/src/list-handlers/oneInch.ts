import { CHAIN_CONFIGS } from "@src/configs";
import { NetworkName, Token } from "@src/types";

const ONEINCH_BASE = `https://partners.mewapi.io/oneinch/v6.0/`;

export const supportedChains: NetworkName[] = [
  NetworkName.Ethereum,
  NetworkName.Binance,
  NetworkName.Matic,
  NetworkName.Optimism,
  NetworkName.Arbitrum,
  NetworkName.Gnosis,
  NetworkName.Avalanche,
  NetworkName.Fantom,
  NetworkName.Kaia,
  NetworkName.Aurora,
  NetworkName.ZkSync,
  NetworkName.Base,
];

export async function getOneInchTokens(
  chainName: NetworkName,
): Promise<Map<Lowercase<string>, Token>> {
  return fetch(`${ONEINCH_BASE}${CHAIN_CONFIGS[chainName].chainId}/tokens`)
    .then((res) => res.json())
    .then((_json) => {
      // TODO: is this a retry?
      if (!_json.tokens) return getOneInchTokens(chainName);
      const json = _json as {
        tokens: Record<string, Token>;
      };
      const addresses = Object.keys(json.tokens);
      addresses.forEach((addr) => {
        json.tokens[addr].type = CHAIN_CONFIGS[chainName].type;
      });
      const map = new Map();
      for (const [address, token] of Object.entries(json.tokens)) {
        map.set(address.toLowerCase() as Lowercase<string>, token);
      }
      return map;
    });
}
