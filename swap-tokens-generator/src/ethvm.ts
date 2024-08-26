const ETHVM_BASE = `https://api-v3.ethvm.dev/`;

const ethvmPost = (requestData: string): Promise<any> =>
  fetch(ETHVM_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: requestData,
  }).then((res) => res.json());

export const getPriceByIDs = (
  ids: string[]
): Promise<Record<string, number | undefined>> => {
  // TODO: chunk this up
  const params = ids.map((i) => `\\"${i}\\"`).join(", ");
  return ethvmPost(
    `{"operationName":null,"variables":{},"query":"{\\n  getCoinGeckoTokenMarketDataByIds(coinGeckoTokenIds: [${params}]) {\\n    current_price\\n  }\\n}\\n"}`
  ).then((json) => {
    const retObj: Record<string, number | undefined> = {};
    ids.forEach((id, idx) => {
      retObj[id] = json.data.getCoinGeckoTokenMarketDataByIds[idx].current_price
        ? json.data.getCoinGeckoTokenMarketDataByIds[idx].current_price
        : undefined;
    });
    return retObj;
  });
};
