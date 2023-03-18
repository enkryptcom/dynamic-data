import { NATIVE_ADDRESS } from "@src/configs";
import { NetworkName, Token } from "@src/types";
import fetch from "node-fetch";
import {
  ChangellyContractMap,
  ChangellyPlatforms,
  NativeTokens,
} from "./utils";

const CHANGELLY_BASE = `https://swap.mewapi.io/changelly`;

interface ChangellyCurrency {
  name: string;
  ticker: string;
  fullName: string;
  enabled: boolean;
  enabledFrom: boolean;
  enabledTo: boolean;
  fixRateEnabled: boolean;
  payinConfirmations: number;
  addressUrl: string;
  transactionUrl: string;
  image: string;
  protocol: string;
  blockchain: string;
  contractAddress?: string;
  token?: Token;
}

export const formatChangellyCurrencies = (
  currencies: ChangellyCurrency[],
  tokensArr: Token[],
  network: NetworkName
): ChangellyCurrency[] => {
  if (!ChangellyPlatforms[network]) return currencies;
  const cPlatform = ChangellyPlatforms[network];
  const contractMap = ChangellyContractMap[network];
  const tokens: Record<string, Token> = {};
  tokensArr.forEach((t) => {
    tokens[t.address] = t;
  });
  currencies.forEach((cur) => {
    if (cur.blockchain !== cPlatform) return;
    if (
      contractMap &&
      contractMap[cur.ticker] &&
      tokens[contractMap[cur.ticker]]
    ) {
      cur.token = tokens[contractMap[cur.ticker]];
    } else if (!cur.contractAddress) {
      cur.token = tokens[NATIVE_ADDRESS];
    } else if (
      cur.contractAddress &&
      tokens[cur.contractAddress.toLowerCase()]
    ) {
      cur.token = tokens[cur.contractAddress.toLowerCase()];
    }
  });
  return currencies;
};

export default async (): Promise<ChangellyCurrency[]> =>
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
      const filtered = json.result.filter(
        (cur) => cur.enabled && cur.enabledFrom && cur.enabledTo
      );
      filtered.forEach((item) => {
        if (NativeTokens[item.ticker]) item.token = NativeTokens[item.ticker];
      });
      filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
      return filtered;
    });
