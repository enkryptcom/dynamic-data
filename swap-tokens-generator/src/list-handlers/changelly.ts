import { NATIVE_ADDRESS } from "@src/configs";
import { NetworkName, Token } from "@src/types";
import fetch from "node-fetch";

const CHANGELLY_BASE = `https://swap.mewapi.io/changelly`;

const ChangellyPlatforms: {
  [key in NetworkName]?: string;
} = {
  [NetworkName.Ethereum]: "ethereum",
  [NetworkName.Matic]: "polygon",
  [NetworkName.Binance]: "binance_smart_chain",
  [NetworkName.EthereumClassic]: "ethereum_classic",
  [NetworkName.Avalanche]: "avaxc",
  [NetworkName.Klaytn]: "klaytn",
  [NetworkName.Optimism]: "optimism",
};
const ChangellyContractMap: {
  [key in NetworkName]?: Record<string, string>;
} = {
  [NetworkName.Avalanche]: {
    gmx: "0x62edc0692bd897d2295872a9ffcac5425011c661",
    joe: "0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd",
    usdtavac: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7",
    usdcavac: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
    qi: "0x8729438eb15e2c8b576fcc6aecda6a148776c0f5",
  },
};

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
      filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
      return filtered;
    });
