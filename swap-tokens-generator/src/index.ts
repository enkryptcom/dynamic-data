import { writeFileSync } from "fs";
import oneInch, {
  supportedChains as oneInchSupportedChains,
} from "./list-handlers/oneInch";
import parawap, {
  supportedChains as paraswapSupportedChains,
} from "./list-handlers/paraswap";
import coingecko, {
  getCoinGeckoTopTokenInfo,
  supportedChains as cgSupportedChains,
} from "./list-handlers/coingecko";
import changelly, {
  formatChangellyCurrencies,
} from "./list-handlers/changelly";
import { NetworkName, Token } from "./types";
import { CHAIN_CONFIGS, NATIVE_ADDRESS } from "./configs";
import PriceFeed from "./pricefeed";
import { getPriceByIDs } from "./ethvm";

const runner = async () => {
  const oneInchTokens: Record<string, Record<string, Token>> = {};
  const paraswapTokens: Record<string, Record<string, Token>> = {};
  const coingeckoTokens: Record<string, Record<string, Token>> = {};
  const allChains = Object.values(NetworkName);
  for (const chain of cgSupportedChains) {
    await coingecko(chain).then((results) => {
      coingeckoTokens[chain] = results;
    });
  }
  for (const chain of oneInchSupportedChains) {
    await oneInch(chain).then((results) => {
      oneInchTokens[chain] = results;
    });
  }
  const paraswapPromises = paraswapSupportedChains.map((chain, idx) =>
    parawap(chain).then((results) => {
      paraswapTokens[paraswapSupportedChains[idx]] = results;
    })
  );
  const topTokenInfo = await getCoinGeckoTopTokenInfo();
  let changellyTokens = await changelly();
  const prices = await PriceFeed();
  let ethvmPrices: Record<string, number | undefined> = {};
  Promise.all(paraswapPromises).then(() => {
    const allResults = [coingeckoTokens, oneInchTokens, paraswapTokens];
    allChains.forEach((chain) => {
      const tokens: Token[] = [];
      const topTokens: { rank: number; token: Token }[] = [];
      const trendingTokens: { rank: number; token: Token }[] = [];
      const includedTokens: string[] = [];
      const priceMissingIds: string[] = [];

      const addTokensIfNotAdded = (items: Record<string, Token>) => {
        const addresses = Object.keys(items);
        addresses.forEach((address) => {
          if (includedTokens.includes(address)) return;
          const cgId = topTokenInfo.contractsToId[address] as string;
          let price =
            prices[chain] && prices[chain][address]
              ? prices[chain][address]
              : null;
          if (!price && cgId) {
            price = topTokenInfo.topTokens[cgId]
              ? topTokenInfo.topTokens[cgId].price
              : null;
            if (!price) priceMissingIds.push(cgId);
          }
          const token: Token = {
            address: items[address].address,
            decimals: items[address].decimals,
            logoURI: items[address].logoURI,
            name: items[address].name,
            symbol: items[address].symbol,
            type: items[address].type,
          };
          if (price) token.price = price;
          if (cgId) {
            if (topTokenInfo.topTokens[cgId])
              token.rank = topTokenInfo.topTokens[cgId].rank;
            token.cgId = cgId;
          }
          if (address !== NATIVE_ADDRESS) tokens.push(token);
          if (address === NATIVE_ADDRESS) {
            token.cgId = CHAIN_CONFIGS[chain].cgId;
            if (topTokenInfo.topTokens[token.cgId]) {
              token.rank = topTokenInfo.topTokens[token.cgId].rank;
              token.price = topTokenInfo.topTokens[token.cgId].price;
            }
            tokens.unshift(token);
          }
          includedTokens.push(address);
          if (!cgId) return;
          if (topTokenInfo.topTokens[cgId])
            topTokens.push({
              rank: topTokenInfo.topTokens[cgId].rank,
              token,
            });
          if (topTokenInfo.trendingTokens[cgId])
            trendingTokens.push({
              rank: topTokenInfo.trendingTokens[cgId] as number,
              token,
            });
        });
      };
      allResults.forEach((res) => {
        if (res[chain]) addTokensIfNotAdded(res[chain]);
      });
      const native = tokens.shift();
      tokens.sort((a, b) => a.name.localeCompare(b.name));
      tokens.unshift(native);
      topTokens.sort((a, b) => a.rank - b.rank);
      trendingTokens.sort((a, b) => a.rank - b.rank);
      changellyTokens = formatChangellyCurrencies(
        changellyTokens,
        tokens,
        chain
      );
      getPriceByIDs(priceMissingIds).then((missingPrices) => {
        ethvmPrices = { ...missingPrices, ...ethvmPrices };
        writeFileSync(
          `./dist/lists/${chain}.json`,
          JSON.stringify({
            all: tokens.map((t) => {
              if (!t.price && t.cgId) t.price = missingPrices[t.cgId];
              return t;
            }),
            trending: trendingTokens.map((t) => {
              if (!t.token.price && t.token.cgId)
                t.token.price = missingPrices[t.token.cgId];
              return t.token;
            }),
            top: topTokens.map((t) => {
              if (!t.token.price && t.token.cgId)
                t.token.price = missingPrices[t.token.cgId];
              return t.token;
            }),
          })
        );
      });
    });
    changellyTokens.forEach((t) => {
      if (t.token && t.token.cgId && topTokenInfo.topTokens[t.token.cgId])
        t.token.price = topTokenInfo.topTokens[t.token.cgId].price;
      else if (t.token && t.token.cgId && ethvmPrices[t.token.cgId])
        t.token.price = ethvmPrices[t.token.cgId];
    });
    writeFileSync(
      `./dist/lists/changelly.json`,
      JSON.stringify(changellyTokens)
    );
    writeFileSync(`./dist/lists/top-tokens.json`, JSON.stringify(topTokenInfo));
  });
};
runner();
