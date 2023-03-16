import { NetworkName, Token } from "@src/types";
import fetch from "node-fetch";

const CG_BASE = `https://tokens.coingecko.com/`;

const cgPlatform: Record<NetworkName, string> = {
  [NetworkName.Ethereum]: "ethereum",
  [NetworkName.Matic]: "polygon-pos",
  [NetworkName.Binance]: "binance-smart-chain",
  [NetworkName.Arbitrum]: "arbitrum-one",
  [NetworkName.Avalanche]: "avalanche",
  [NetworkName.Aurora]: "aurora",
  [NetworkName.Fantom]: "fantom",
  [NetworkName.Gnosis]: "xdai",
  [NetworkName.Klaytn]: "klay-token",
  [NetworkName.Optimism]: "optimistic-ethereum",
};
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
  fetch(`${CG_BASE}${cgPlatform[chainName]}/all.json`)
    .then((res) => res.json())
    .then((_json) => {
      const json = _json as {
        tokens: Token[];
      };
      const resp: Record<string, Token> = {};
      json.tokens.forEach((token) => {
        resp[token.address.toLowerCase()] = token;
      });
      return resp;
    });
