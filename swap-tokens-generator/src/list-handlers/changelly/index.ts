import { NATIVE_ADDRESS } from "@src/configs";
import { NetworkName, Token } from "@src/types";
import fetch from "node-fetch";
import {
  ChangellyContractMap,
  ChangellyPlatforms,
  NativeTokens,
} from "./utils";

// Changelly is CryptoCurrency exchange that supports cross chain swaps

const CHANGELLY_BASE = `https://partners.mewapi.io/changelly-v2`;

interface ChangellyCurrency {
  /** @example "EURT" */
  name: string;
  /** @example "eurt" */
  ticker: string;
  /** @example "Tether EURt" */
  fullName: string;
  enabled: boolean;
  enabledFrom: boolean;
  enabledTo: boolean;
  fixRateEnabled: boolean;
  /** @example 4 */
  payinConfirmations: number;
  /** @example "https://etherscan.io/token/0xC581b735A1688071A1746c968e0798D642EDE491?a=%1$s" */
  addressUrl: string;
  /** @example "https://etherscan.io/tx/%1$s" */
  transactionUrl: string;
  /** @example "https://cdn.changelly.com/icons/eurt.png" */
  image: string;
  /** @example "ERC20" */
  protocol: string;
  /** @example "ethereum" */
  blockchain: string;
  /** @example "0xC581b735A1688071A1746c968e0798D642EDE491" */
  contractAddress?: string;
  /** Not given by Changelly API response, filled in later by {@link formatChangellyCurrencies} */
  token?: Token;
}

export const formatChangellyCurrencies = (
  currencies: ChangellyCurrency[],
  tokensArr: Token[],
  network: NetworkName,
): ChangellyCurrency[] => {
  // Changelly must support cross-chain swaps on this network
  if (!ChangellyPlatforms[network]) return currencies;

  /** Changelly Blockchain ID */
  const cPlatform = ChangellyPlatforms[network];

  const contractMap = ChangellyContractMap[network];

  const tokens: Record<string, Token> = {};
  tokensArr.forEach((t) => {
    tokens[t.address] = t;
  });

  // Try to find a token for each currency
  currencies.forEach((cur) => {
    // Drop if we don't support swaps on this network
    if (cur.blockchain !== cPlatform) return;
    if (
      contractMap &&
      contractMap[cur.ticker] &&
      tokens[contractMap[cur.ticker]]
    ) {
      // Join the currency's token by ticker symbol
      cur.token = tokens[contractMap[cur.ticker]];
    } else if (!cur.contractAddress) {
      // Currency doesn't have an address, it's the native currency of the chain
      cur.token = tokens[NATIVE_ADDRESS];
    } else if (
      cur.contractAddress &&
      tokens[cur.contractAddress.toLowerCase()]
    ) {
      // Join the currency's token by it's address
      cur.token = tokens[cur.contractAddress.toLowerCase()];
    }
  });

  return currencies;
};

/**
 * Get swappable tokens on Changelly
 *
 * Returns tokens sorted by name, ascending
 */
export default async (): Promise<ChangellyCurrency[]> =>
  // curl https://partners.mewapi.io/changelly-v2 -X POST -H Accept:application/json -H Content-Type:application/json --data '{"id":"1","jsonrpc":"2.0","method":"getCurrenciesFull","params":{}}'
  fetch(`${CHANGELLY_BASE}`, {
    method: "POST",
    body: JSON.stringify({
      id: "1",
      jsonrpc: "2.0",
      method: "getCurrenciesFull",
      params: {},
    }),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((_json) => {
      const json = _json as {
        result: ChangellyCurrency[];
      };

      // Only keep tokens that can be swapped in both directions
      const filtered = json.result.filter(
        (cur) => cur.enabled && cur.enabledFrom && cur.enabledTo,
      );

      // Override info of native currencies with our hard coded info
      filtered.forEach((item) => {
        if (NativeTokens[item.ticker]) item.token = NativeTokens[item.ticker];
      });

      // Sort by name, ascending
      filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
      return filtered;
    });
