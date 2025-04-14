import { CHAIN_CONFIGS } from "@src/configs";
import { NetworkName, Token } from "@src/types";

const PARASWAP_BASE = `https://apiv5.paraswap.io/`;
const TIMEOUT = 30_000;

export const supportedChains: NetworkName[] = [
  NetworkName.Ethereum,
  NetworkName.Binance,
  NetworkName.Matic,
  NetworkName.Avalanche,
  // NetworkName.Fantom,
  NetworkName.Arbitrum,
  NetworkName.Base,
  NetworkName.Optimism,
  NetworkName.MaticZK,
];

export async function getParaswapTokens(
  chainName: NetworkName,
  abortable: Readonly<{ signal: AbortSignal }>,
): Promise<Map<Lowercase<string>, Token>> {
  const url = `${PARASWAP_BASE}tokens/${CHAIN_CONFIGS[chainName].chainId}`;
  const res = await fetch(url, {
    signal: AbortSignal.any([AbortSignal.timeout(TIMEOUT), abortable.signal]),
    headers: [["Accept", "application/json"]],
  });

  if (!res.ok) {
    let text = await res
      .text()
      .catch((err) => `! Failed to decode response text: ${err}`);
    const len = text.length;
    if (len > 512 + 10 + len.toString().length)
      text = `${text.slice(0, 512)}... (512/${len})`;
    throw new Error(
      `Failed to fetch Paraswap tokens for ${chainName} with` +
        ` ${res.status} ${res.statusText} at ${url} ${text}`,
    );
  }

  const json = (await res.json()) as {
    tokens: {
      symbol: string;
      address: string;
      decimals: number;
      img: string;
    }[];
  };

  const map: Map<Lowercase<string>, Token> = new Map();
  for (const token of json.tokens) {
    if (token.img === "https://cdn.paraswap.io/token/token.png") {
      // no need tokens without atleast a proper image
      continue;
    }
    map.set(token.address.toLowerCase() as Lowercase<string>, {
      type: CHAIN_CONFIGS[chainName].type,
      address: token.address,
      decimals: token.decimals,
      logoURI: token.img,
      name: token.symbol,
      symbol: token.symbol,
    });
  }
  return map;
}
