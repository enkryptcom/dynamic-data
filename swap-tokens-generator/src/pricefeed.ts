import { CHAIN_CONFIGS } from "@src/configs";
import { NetworkName } from "@src/types";

const PARASWAP_BASE = `https://api.paraswap.io/`;

export const supportedChains: NetworkName[] = [
  NetworkName.Ethereum,
  NetworkName.Binance,
  NetworkName.Matic,
  NetworkName.Avalanche,
  // NetworkName.Fantom,
  NetworkName.Arbitrum,
  NetworkName.Optimism,
];

export default async (): Promise<
  Record<NetworkName, Record<string, number>>
> => {
  const retResponse: Record<string, Record<string, number>> = {};
  const promises = supportedChains.map((chainName) =>
    fetch(`${PARASWAP_BASE}fiat/prices/${CHAIN_CONFIGS[chainName].chainId}`)
      .then((res) => res.json())
      .then((_json) => {
        const json = _json as {
          prices: Record<
            string,
            {
              price: number;
              address: string;
            }
          >;
        };
        retResponse[chainName] = {};
        const prices = Object.values(json.prices);
        prices.forEach((p) => {
          retResponse[chainName][p.address.toLowerCase()] = p.price;
        });
      }),
  );
  return Promise.all(promises).then(() => retResponse);
};
