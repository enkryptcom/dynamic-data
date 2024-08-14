import { writeFileSync } from "fs";
import { join } from "path";
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
import requestJupiter from "./list-handlers/jupiter";

const runner = async () => {
  // The native currency on a chain is given address 0xee..ee
  // For example, on Ethereum, ETH is given address 0xee..ee

  /** network name -> token address -> token info */
  const coingeckoTokens: Record<string, Record<string, Token>> = {};
  /** network name -> token address -> token info */
  const oneInchTokens: Record<string, Record<string, Token>> = {};
  /** network name -> token address -> token info */
  const paraswapTokens: Record<string, Record<string, Token>> = {};
  /** network name (only Solana) -> token address -> token info */
  const jupiterTokens: Record<string, Record<string, Token>> = {};

  // Load CoinGecko tokens for each chain
  console.info(`Fetching CoinGecko tokens  networks=${cgSupportedChains.length}`)
  const allChains = Object.values(NetworkName);
  for (let i = 0, len = cgSupportedChains.length; i < len; i++) {
    const chain = cgSupportedChains[i]
    console.info(`Fetching CoinGecko tokens  ${i + 1}/${len}  chain=${chain}`)
    coingeckoTokens[chain] = await coingecko(chain);
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Load 1Inch tokens for each chain
  console.info(`Fetching 1inch tokens  networks=${oneInchSupportedChains.length}`)
  for (let i = 0, len = oneInchSupportedChains.length; i < len; i++) {
    const chain = oneInchSupportedChains[i];
    console.info(`Fetching 1inch tokens  ${i + 1}/${len}  chain=${chain}`)
    oneInchTokens[chain] = await oneInch(chain)
  }

  // Load ParaSwap tokens for each chain
  console.info(`Fetching Paraswap tokens  networks=${paraswapSupportedChains.length}`)
  const paraswapPromises = paraswapSupportedChains.map((chain, idx) =>
    parawap(chain).then((results) => {
      paraswapTokens[paraswapSupportedChains[idx]] = results;
      console.info(`Finished fetching Paraswap token  ${idx + 1}/${paraswapSupportedChains.length}  chain=${chain}`)
    })
  );

  // Load Jupiter tokens
  jupiterTokens[NetworkName.Solana] = await requestJupiter()

  console.info("Fetching top CoinGecko tokens")
  /** Top tokens fetched from CoinGecko */
  const topTokenInfo = await getCoinGeckoTopTokenInfo();

  console.info("Fetching Changelly tokens")
  /** All tokens fetched from Changelly */
  let changellyTokens = await changelly();

  console.info("Fetching ParaSwap Pricefeed")
  /** Token prices fetched from Paraswap */
  const prices = await PriceFeed();

  // Wait for Paraswap tokens to finish loading
  await Promise.all(paraswapPromises)
  console.info("Finished fetching all Paraswap tokens")

  /** ? */
  let ethvmPrices: Record<string, number | undefined> = {};
  const allResults = [coingeckoTokens, oneInchTokens, paraswapTokens, jupiterTokens];
  allChains.forEach((chain) => {
    console.info(`Processing chain's tokens  chain=${chain}`)

    // Aggregate tokens on this network
    // Combines together data over differnt swap providers and enriches with CoinGecko info & pricing

    /** Running results of al tokens available to swaps on this network */
    const tokens: Token[] = [];
    /** Running results of top tokens on this network */
    const topTokens: { rank: number; token: Token }[] = [];
    /** Running results trending tokens on this network */
    const trendingTokens: { rank: number; token: Token }[] = [];
    /** Running set of tokens we've already processed, enriched with CoinGecko data and added to the aggregating tokens list */
    const includedTokens = new Set<string>()
    /** Running list of tokens that we couldn't find a price for */
    const priceMissingIds: string[] = [];

    /**
     * Enrich tokens with extra data and stage them to the running list of tokens for this netweork
     *  - coingecko id
     *  - price
     *  - rank
     */
    const addTokensIfNotAdded = (items: Record<string, Token>) => {
      const addresses = Object.keys(items);

      addresses.forEach((address) => {
        // Already procesed this token in this network
        if (includedTokens.has(address)) return;

        const cgId = topTokenInfo.contractsToId[address] as string;
        // Initialise as ParaSwap price
        let price =
          prices[chain] && prices[chain][address]
            ? prices[chain][address]
            : null;

        if (!price && cgId) {
          // No paraswap price but maybe has a CoinGecko price
          price = topTokenInfo.topTokens[cgId]
            ? topTokenInfo.topTokens[cgId].price
            : null;
          if (!price) priceMissingIds.push(cgId);
        }

        // Normalise the token
        const token: Token = {
          address: items[address].address,
          decimals: items[address].decimals,
          logoURI: items[address].logoURI,
          name: items[address].name,
          symbol: items[address].symbol,
          type: items[address].type,
        };

        // Attach pricing
        if (price) token.price = price;

        // Attach CoinGecko ID & rank (if applicable)
        if (cgId) {
          if (topTokenInfo.topTokens[cgId])
            token.rank = topTokenInfo.topTokens[cgId].rank;
          token.cgId = cgId;
        }

        if (address !== NATIVE_ADDRESS) tokens.push(token);
        if (address === NATIVE_ADDRESS) {
          token.cgId = CHAIN_CONFIGS[chain].cgId;
          if (topTokenInfo.topTokens[token.cgId]) {
            // Redundant? If native chain currency, override ParaSwap price with CoinGecko price
            token.rank = topTokenInfo.topTokens[token.cgId].rank;
            token.price = topTokenInfo.topTokens[token.cgId].price;
          }
          // Put native currencies at the front of the token list for this network
          tokens.unshift(token);
        }

        // Register this as processesed to stop other providers from having to process the same token
        includedTokens.add(address);
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
    // Sort tokens by name ascending, keeping the native token at the top if it exists
    let native: undefined | Token
    if (tokens.length && tokens[0].address === NATIVE_ADDRESS) {
      native = tokens.shift();
    }
    tokens.sort((a, b) => a.name.localeCompare(b.name));
    if (native) tokens.unshift(native);
    topTokens.sort((a, b) => a.rank - b.rank);
    trendingTokens.sort((a, b) => a.rank - b.rank);
    console.info(
      `Finished aggregating tokens`
      + `  chain=${chain}`
      + `  tokens=${tokens.length}`
      + `  trendingTokens=${trendingTokens.length}`
      + `  includedTokens=${includedTokens.size}`
      + `  priceMissingIds=${priceMissingIds.length}`
    )
    console.info(
      `Formatting changelly currencies`
      + `  chain=${chain}`
      + `  changelly=${changellyTokens.length}`
      + `  tokens=${tokens.length}`
    )
    changellyTokens = formatChangellyCurrencies(
      changellyTokens,
      tokens,
      chain
    );
    // For any tokens we couldn't find prices for, get their prices from EthVM instead
    console.info(`Requesting missing prices from EthVM  chain=${chain}  missing=${priceMissingIds.length}`)
    getPriceByIDs(priceMissingIds).then((missingPrices) => {
      ethvmPrices = { ...missingPrices, ...ethvmPrices };
      const filename = join('dist', 'lists', `${chain}.json`)
      console.info(
        `Saving prices`
        + `  chain=${chain}`
        + `  filename=${filename}`
        + `  all=${tokens.length}`
        + `  trending=${trendingTokens.length}`
        + `  top=${topTokens.length}`
      )
      writeFileSync(
        filename,
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

  const changellyFilename = join('dist', 'lists', 'changelly.json')
  console.info(`Saving changelly tokens  filename=${changellyFilename}`)
  writeFileSync(
    changellyFilename,
    JSON.stringify(changellyTokens)
  );

  console.info(`Saving top tokens  filename=${changellyFilename}`)
  const topTokensFilename = join('dist', 'lists', 'top-tokens.json')
  writeFileSync(topTokensFilename, JSON.stringify(topTokenInfo));

  console.info(`Done`)
};

runner();
