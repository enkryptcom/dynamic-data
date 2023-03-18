import { CHAIN_CONFIGS, NATIVE_ADDRESS } from "@src/configs";
import { NetworkName, Token } from "@src/types";
import fetch from "node-fetch";

const CG_BASE = `https://tokens.coingecko.com/`;
const CG_API_BASE = `https://api.coingecko.com/api/v3/`;

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
  [NetworkName.EthereumClassic]: "ethereum-classic",
  [NetworkName.Moonbeam]: "moonbeam",
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
  NetworkName.EthereumClassic,
  NetworkName.Moonbeam,
];
export const getTrendingTokenId = async (): Promise<Record<string, number>> =>
  fetch(`${CG_API_BASE}search/trending`)
    .then((res) => res.json())
    .then((_json) => {
      const json = _json as {
        coins: {
          item: {
            id: string;
            score: number;
          };
        }[];
      };
      const resp: Record<string, number> = {};
      json.coins.forEach((coin) => {
        resp[coin.item.id] = coin.item.score;
      });
      return resp;
    });

export const getTopTokenIds = async (): Promise<Record<string, number>> =>
  fetch(
    `${CG_API_BASE}coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false`
  )
    .then((res) => res.json())
    .then((_json) => {
      const json = _json as {
        id: string;
        market_cap_rank: number;
      }[];
      const resp: Record<string, number> = {};
      json.forEach((coin) => {
        resp[coin.id] = coin.market_cap_rank;
      });
      return resp;
    });

export const getContractAddressesToCG = async (): Promise<
  Record<string, string>
> =>
  fetch(`${CG_API_BASE}coins/list?include_platform=true`)
    .then((res) => res.json())
    .then((_json) => {
      const json = _json as {
        id: string;
        platforms: Record<string, string>;
      }[];
      const resp: Record<string, string> = {};
      json.forEach((coin) => {
        const addresses = Object.values(coin.platforms);
        addresses.forEach((addr) => {
          resp[addr] = coin.id;
        });
      });
      return resp;
    });
export const getCoinGeckoTopTokenInfo = async () => {
  const promises = [
    getTrendingTokenId(),
    getTopTokenIds(),
    getContractAddressesToCG(),
  ];
  return Promise.all(promises).then((result) => ({
    trendingTokens: result[0],
    topTokens: result[1],
    contractsToId: result[2],
  }));
};
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
      resp[NATIVE_ADDRESS] = {
        address: NATIVE_ADDRESS,
        decimals: CHAIN_CONFIGS[chainName].decimals,
        logoURI: CHAIN_CONFIGS[chainName].logoURI,
        name: CHAIN_CONFIGS[chainName].name,
        symbol: CHAIN_CONFIGS[chainName].symbol,
        cgId: CHAIN_CONFIGS[chainName].cgId,
      };
      return resp;
    });
