import { CHAIN_CONFIGS } from "@src/configs";
import { NetworkName, Token } from "@src/types";
import fetch from "node-fetch";

const PARASWAP_BASE = `https://apiv5.paraswap.io/`;

export const supportedChains: NetworkName[] = [
  NetworkName.Ethereum,
  NetworkName.Binance,
  NetworkName.Matic,
  NetworkName.Avalanche,
  NetworkName.Fantom,
  NetworkName.Arbitrum,
  NetworkName.Base,
  NetworkName.Optimism,
  NetworkName.MaticZK,
];

export default async (chainName: NetworkName): Promise<Record<string, Token>> =>
  fetch(`${PARASWAP_BASE}tokens/${CHAIN_CONFIGS[chainName].chainId}`)
    .then((res) => res.json())
    .then((_json) => {
      const json = _json as {
        tokens: {
          symbol: string;
          address: string;
          decimals: number;
          img: string;
        }[];
      };
      const resp: Record<string, Token> = {};
      json.tokens.forEach((token) => {
        if (token.img === "https://cdn.paraswap.io/token/token.png") return; // no need tokens without atleast a proper image
        resp[token.address.toLowerCase()] = {
          type: CHAIN_CONFIGS[chainName].type,
          address: token.address,
          decimals: token.decimals,
          logoURI: token.img,
          name: token.symbol,
          symbol: token.symbol,
        };
      });
      return resp;
    });
