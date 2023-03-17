import fetch from "node-fetch";

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
}
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
      return json.result.filter(
        (cur) => cur.enabled && cur.enabledFrom && cur.enabledTo
      );
    });
