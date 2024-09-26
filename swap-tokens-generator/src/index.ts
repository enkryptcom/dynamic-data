import { writeFileSync } from "fs";
import { join } from "path";
import {
  supportedChains as oneInchSupportedChains,
  getOneInchTokens,
} from "./list-handlers/oneInch";
import {
  getParaswapTokens,
  supportedChains as paraswapSupportedChains,
} from "./list-handlers/paraswap";
import {
  getCoinGeckoTopTokenInfo,
  supportedChains as cgSupportedChains,
  getCoinGeckoTokens,
} from "./list-handlers/coingecko";
import changelly, {
  hydrateChangellyCurrencies,
} from "./list-handlers/changelly";
import { NetworkName, Token } from "./types";
import { CHAIN_CONFIGS, NATIVE_ADDRESS } from "./configs";
import PriceFeed from "./pricefeed";
import { getEthVMPriceByIDs } from "./ethvm";
import requestJupiter from "./list-handlers/jupiter";
import { Logger, LogLevel } from "./logger";
import { getRangoTokens, mergeRangoEnkryptTokens, RangoEnkryptToken } from "./list-handlers/rango";
// import Rango from 'rango';

const runner = async () => {
  const logger = new Logger({ level: LogLevel.TRACE });
  const aborter = new AbortController();
  const abortable = { signal: aborter.signal, }

  // The native currency on a chain is given address 0xee..ee
  // For example, on Ethereum, ETH is given address 0xee..ee

  /** network name -> token address -> token info */
  const coingeckoTokens: Map<NetworkName, Map<Lowercase<string>, Token>> = new Map();
  /** network name -> token address -> token info */
  const oneInchTokens: Map<NetworkName, Map<Lowercase<string>, Token>> = new Map();
  /** network name -> token address -> token info */
  const paraswapTokens: Map<NetworkName, Map<Lowercase<string>, Token>> = new Map();
  /** network name (only Solana) -> token address -> token info */
  const jupiterTokens: Map<NetworkName, Map<Lowercase<string>, Token>> = new Map();
  /** All rango tokens merged with Enkrypt tokens */
  const rangoTokens: RangoEnkryptToken[] = []

  // Load CoinGecko tokens for each chain
  logger.sinfo(
    "Fetching CoinGecko tokens",
    "networks", cgSupportedChains.length,
  );
  const allChains = Object.values(NetworkName);

  for (let i = 0, len = cgSupportedChains.length; i < len; i++) {
    if (i > 0) {
      await new Promise<void>(function(res, rej) {
        function onTimeout() {
          cleanup();
          res();
        }
        function onAbort() {
          cleanup();
          rej(abortable.signal.reason);
        }
        function cleanup() {
          clearTimeout(timeout);
          abortable.signal.removeEventListener("abort", onAbort);
        }
        const timeout = setTimeout(onTimeout, 1_000);
        abortable.signal.addEventListener("abort", onAbort);
      });
    }
    const chain = cgSupportedChains[i];
    logger.sinfo(
      "Fetching CoinGecko tokens",
      "number", i + 1,
      "len", len,
      "chain", chain,
    );
    const result = await getCoinGeckoTokens(chain);
    coingeckoTokens.set(chain, result);
  }

  // Load 1Inch tokens for each chain
  logger.sinfo(
    "Fetching 1inch tokens",
    "networks", oneInchSupportedChains.length,
  );
  for (let i = 0, len = oneInchSupportedChains.length; i < len; i++) {
    const chain = oneInchSupportedChains[i];
    logger.sinfo(
      "Fetching 1inch tokens",
      "number", i + 1,
      "len", len,
      "chain", chain,
    );
    const result = await getOneInchTokens(chain);
    oneInchTokens.set(chain, result);
  }

  // Load ParaSwap tokens for each chain
  logger.sinfo(
    "Fetching Paraswap tokens",
    "networks", paraswapSupportedChains.length,
  );
  for (let i = 0, len = paraswapSupportedChains.length; i < len; i++) {
    const chain = paraswapSupportedChains[i];
    logger.sinfo(
      "Fetching Paraswap tokens",
      "number", i + 1,
      "len", len,
      "chain", chain,
    );
    const data = await getParaswapTokens(chain, abortable);
    paraswapTokens.set(chain, data);
  }

  logger.info("Fetching top CoinGecko tokens");
  /** Top tokens fetched from CoinGecko */
  const cgTopTokenInfo = await getCoinGeckoTopTokenInfo();

  logger.info("Fetching Changelly tokens");
  /** All tokens fetched from Changelly */
  let changellyTokens = await changelly(abortable);

  logger.info("Fetching Rango tokens");
  /** All tokens fetched from Changelly */
  const rangoTokenMetas = await getRangoTokens(abortable);

  // Load Jupiter tokens
  logger.info(`Fetching Jupiter tokens`);
  jupiterTokens.set(NetworkName.Solana, await requestJupiter(logger, abortable));

  logger.info("Fetching ParaSwap Pricefeed");
  /** Token prices fetched from Paraswap */
  const paraswapPrices = await PriceFeed();

  /** Prices loaded from EthVM for tokens for whom we were unable to find a price */
  const ethvmPrices = new Map<string, number>();

  for (const chain of allChains) {
    logger.sinfo("Processing chain's tokens", "chain", chain);

    // Aggregate tokens on this network
    // Combines together data over differnt swap providers and enriches with CoinGecko info & pricing

    /** Running results of all tokens available to swaps on this network */
    const tokens: Token[] = [];
    /** Running results of top tokens on this network */
    const topTokens: { rank: number; token: Token }[] = [];
    /** Running results trending tokens on this network */
    const trendingTokens: { rank: number; token: Token }[] = [];
    /** Running set of tokens we've already processed, enriched with CoinGecko data and added to the aggregating tokens list */
    const processedTokenAddresses = new Set<Lowercase<string>>();
    /** Running list of tokens that we couldn't find a price for */
    const priceMissingIds: string[] = [];

    /**
     * Enrich tokens with extra data and stage them to running lists of tokens for this netweork
     *  - coingecko id
     *  - price
     *  - rank
     */
    for (const providerNetworkToAddressToTokenMap of [coingeckoTokens, oneInchTokens, paraswapTokens, jupiterTokens]) {
      /** Map of lowercase address -> token for the provider */
      const providerAddressToTokenMap = providerNetworkToAddressToTokenMap.get(chain)

      // Skip if we don't support this provider on this chain
      if (!providerAddressToTokenMap) continue

      /** Lowercase token addresses of this provider on this network */
      for (const [lcaddress, rawToken] of providerAddressToTokenMap) {
        // Skip if we've already procedssed this token on this chain
        if (processedTokenAddresses.has(lcaddress)) continue

        /** CoinGecko unique coin (currency/token) id */
        let cgId: undefined | string
        if (lcaddress === NATIVE_ADDRESS) {
          // Native currency
          cgId = CHAIN_CONFIGS[chain].cgId;
        } else {
          cgId = cgTopTokenInfo.contractsToId.get(lcaddress)
        }

        // Initialise to ParaSwap price, if found
        let price: undefined | number = paraswapPrices[chain]?.[lcaddress]

        if (!price && cgId) {
          // No ParaSwap price but maybe has a CoinGecko price
          price = cgTopTokenInfo.topTokens.get(cgId)?.price
        }

        let rank: undefined | number
        if (cgId && cgTopTokenInfo.topTokens.get(cgId)) {
          rank = cgTopTokenInfo.topTokens.get(cgId)!.rank
        }

        const token: Token = {
          address: rawToken.address,
          decimals: rawToken.decimals,
          logoURI: rawToken.logoURI,
          name: rawToken.name,
          symbol: rawToken.symbol,
          type: rawToken.type,
          rank,
          cgId,
          price,
        };

        // Combine results
        tokens.push(token);

        // Register top token on this network
        if (cgId && cgTopTokenInfo.topTokens.get(cgId)) {
          topTokens.push({
            rank: cgTopTokenInfo.topTokens.get(cgId)!.rank,
            token,
          });
        }

        // Register as trending token on this network
        if (cgId && cgTopTokenInfo.trendingTokens.get(cgId)) {
          trendingTokens.push({
            rank: cgTopTokenInfo.trendingTokens.get(cgId)!,
            token,
          });
        }

        // Register this token as missing a price
        if (cgId && token.price == null) {
          priceMissingIds.push(cgId);
        }

        // Register this as processesed to stop other providers from having to process the same token
        processedTokenAddresses.add(lcaddress);
      }
    }

    // Sort tokens by name ascending, keeping the native token at the top (if exists)
    tokens.sort((a, b) => {
      // Native tokens first
      if (a.address === NATIVE_ADDRESS) return -1;
      if (b.address === NATIVE_ADDRESS) return 1;
      return a.name.localeCompare(b.name)
    });

    // Sort top tokens ascending by rank
    topTokens.sort((a, b) => a.rank - b.rank);

    // Sort trending tokens ascending by rank
    trendingTokens.sort((a, b) => a.rank - b.rank);

    hydrateChangellyCurrencies(changellyTokens, tokens, chain);

    const networkRangoTokens = mergeRangoEnkryptTokens(logger, chain, rangoTokenMetas, tokens)
    rangoTokens.push(...networkRangoTokens)

    logger.sinfo(
      `Finished aggregating tokens`,
      "chain", chain,
      "tokens", tokens.length,
      "trendingTokens", trendingTokens.length,
      "includedTokens", processedTokenAddresses.size,
      "priceMissingIds", priceMissingIds.length,
      "addedRangoTokens", networkRangoTokens.length,
      "totalRangoTokens", rangoTokens.length,
    );

    // For any tokens we couldn't find prices for, get their prices from EthVM instead
    /** CoinGecko id -> current price USD */
    if (priceMissingIds.length) {
      const pricesFound = await getEthVMPriceByIDs(logger, priceMissingIds, abortable);
      for (const [cgid, price] of pricesFound) {
        ethvmPrices.set(cgid, price);
      }
      logger.sinfo(
        "Found missing prices",
        "missing", priceMissingIds.length,
        "found", pricesFound.size,
        "stillMissing", priceMissingIds.length - pricesFound.size,
        "totalFound", ethvmPrices.size,
      );
    }
    const filename = join("dist", "lists", `${chain}.json`);
    logger.sinfo(
      "Saving prices",
      "filename", filename,
      "chain", chain,
      "all", tokens.length,
      "trending", trendingTokens.length,
      "top", topTokens.length,
    );
    const content = {
      all: tokens.map((t) => {
        if (!t.price && t.cgId) {
          t.price = ethvmPrices.get(t.cgId);
        }
        return t;
      }),
      trending: trendingTokens.map((t) => {
        if (!t.token.price && t.token.cgId) {
          t.token.price = ethvmPrices.get(t.token.cgId);
        }
        return t.token;
      }),
      top: topTokens.map((t) => {
        if (!t.token.price && t.token.cgId) {
          t.token.price = ethvmPrices.get(t.token.cgId);
        }
        return t.token;
      }),
    };
    writeFileSync(filename, JSON.stringify(content));
  }

  // Update any missing Changelly token prices where possible
  // TODO: is this necessary?
  changellyTokens.forEach((t) => {
    if (t.token && t.token.cgId) {
      t.token.price ??= cgTopTokenInfo.topTokens.get(t.token.cgId)?.price;
      t.token.price ??= ethvmPrices.get(t.token.cgId);
    }
  });

  // Update any missing Rango token prices where possible
  // TODO: is this necessary?
  rangoTokens.forEach((t) => {
    if (t.token && t.token.cgId) {
      t.token.price ??= cgTopTokenInfo.topTokens.get(t.token.cgId)?.price;
      t.token.price ??= ethvmPrices.get(t.token.cgId);
    }
  });

  const changellyFilename = join("dist", "lists", "changelly.json");
  logger.sinfo("Saving Changelly tokens", "filename", changellyFilename);
  writeFileSync(changellyFilename, JSON.stringify(changellyTokens));

  const rangoTokensFilename = join("dist", "lists", "rango.json");
  logger.sinfo("Saving Rango tokens", "filename", rangoTokensFilename);
  writeFileSync(rangoTokensFilename, JSON.stringify(rangoTokens));

  const topTokensFilename = join("dist", "lists", "top-tokens.json");
  logger.sinfo("Saving top tokens", "filename", topTokensFilename);
  writeFileSync(topTokensFilename, JSON.stringify({
    trendingTokens: Object.fromEntries(cgTopTokenInfo.trendingTokens),
    topTokens: Object.fromEntries(cgTopTokenInfo.topTokens),
    contractsToId: Object.fromEntries(cgTopTokenInfo.contractsToId),
  }));

  logger.info(`Done`);
};

runner();
