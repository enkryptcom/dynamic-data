import { NATIVE_ADDRESS } from "@src/configs";
import { Logger } from "..//logger";
import { NetworkName, Token } from "../types"
import { RangoClient, Token as RangoToken, TransactionType } from "rango-sdk-basic";

const RANGO_PUBLIC_API_KEY = "ee7da377-0ed8-4d42-aaf9-fa978a32b18d";

/**
 * `name` is the blockchain id on Rango
 *
 * You can use the Rango API to get a list of tokens to figure out the Rango name of a network
 *
 * @see https://rango-api.readme.io/reference/meta
 *
 * ```sh
 * # Rango token meta (list of all tokens with token metadata, blockchain info, etc)
 * curl 'https://api.rango.exchange/basic/meta?apiKey=c6381a79-2817-4602-83bf-6a641a409e32' -sL -H 'Accept:application/json' | jq .
 * # {
 * #   "tokens": [
 * #     {
 * #       "blockchain": "ETH",
 * #       "symbol": "USDT",
 * #       "name": "USD Tether",
 * #       "isPopular": true,
 * #       "chainId": "1",
 * #       "address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
 * #       "decimals": 6,
 * #       "image": "https://rango.vip/i/r3Oex6",
 * #       "blockchainImage": "https://raw.githubusercontent.com/rango-exchange/assets/main/blockchains/ETH/icon.svg",
 * #       "usdPrice": 1.001,
 * #       "supportedSwappers": [
 * #         "Arbitrum Bridge",
 * #         "ThorChain",
 * # ...
 *
 * # Rango token count per blockchain
 * curl 'https://api.rango.exchange/basic/meta?apiKey=c6381a79-2817-4602-83bf-6a641a409e32' -sL -H 'Accept:application/json' | jq --raw-output .tokens[].blockchain | sort | uniq -c | sort -n
 * # count blockchain
 * # ...
 * #    36 MOONBEAM
 * #    42 CELO
 * #    48 OKC
 * #    50 MOONRIVER
 * #    55 AURORA
 * #    56 LINEA
 * #    58 ZKSYNC
 * #    61 BLAST
 * #   146 OSMOSIS
 * #   147 HECO
 * #   158 CRONOS
 * #   301 OPTIMISM
 * #   368 AVAX_CCHAIN
 * #   437 BASE
 * #   594 POLYGON
 * #   596 ARBITRUM
 * #   833 BSC
 * #  1509 SOLANA
 * #  5610 ETH
 *
 * # Rango token count per blockchain & chain id
 * curl 'https://api.rango.exchange/basic/meta?apiKey=c6381a79-2817-4602-83bf-6a641a409e32' -sL -H 'Accept:application/json' | jq -r '.tokens[] | "\(.blockchain)\t\(.chainId)"' | sort | uniq -c | sort -n | sed 's/^ *\([0-9]*\) *\(.*\)/\1\t\2/' | column -s $'\t' -t
 * # count blockchain     chain id
 * # ...
 * # 50    MOONRIVER      1285
 * # 55    AURORA         1313161554
 * # 56    LINEA          59144
 * # 58    ZKSYNC         324
 * # 61    BLAST          81457
 * # 146   OSMOSIS        osmosis-1
 * # 147   HECO           128
 * # 158   CRONOS         25
 * # 301   OPTIMISM       10
 * # 368   AVAX_CCHAIN    43114
 * # 437   BASE           8453
 * # 594   POLYGON        137
 * # 596   ARBITRUM       42161
 * # 833   BSC            56
 * # 1509  SOLANA         mainnet-beta
 * # 5610  ETH            1
 * ```
 */
const RangoPlatforms: {
  [key in NetworkName]?: {
    /** Standard base10 chain ID, can be obtained from `https://chainlist.org` */
    standardChainId: string;
    /** Solana has a different chain id */
    rangoChainId: string;
    /** Rango name (Rango's identifier for the chain) of a network */
    name: string;
  };
} = {
  [NetworkName.Ethereum]: {
    standardChainId: "1",
    rangoChainId: "1",
    name: "ETH",
  },
  [NetworkName.Binance]: {
    standardChainId: "56",
    rangoChainId: "56",
    name: "BSC",
  },
  [NetworkName.Base]: {
    standardChainId: "8453",
    rangoChainId: "8453",
    name: "BASE",
  },
  [NetworkName.Matic]: {
    standardChainId: "137",
    rangoChainId: "137",
    name: "POLYGON",
  },
  [NetworkName.Optimism]: {
    standardChainId: "10",
    rangoChainId: "10",
    name: "OPTIMISM",
  },
  [NetworkName.Avalanche]: {
    standardChainId: "43114",
    rangoChainId: "43114",
    name: "AVAX_CCHAIN",
  },
  [NetworkName.Fantom]: {
    standardChainId: "250",
    rangoChainId: "250",
    name: "FANTOM",
  },
  [NetworkName.Aurora]: {
    standardChainId: "1313161554",
    rangoChainId: "1313161554",
    name: "AURORA",
  },
  [NetworkName.Gnosis]: {
    standardChainId: "100",
    rangoChainId: "100",
    name: "GNOSIS",
  },
  [NetworkName.Arbitrum]: {
    standardChainId: "42161",
    rangoChainId: "42161",
    name: "ARBITRUM",
  },
  [NetworkName.Moonbeam]: {
    standardChainId: "1284",
    rangoChainId: "1284",
    name: "MOONBEAM",
  },
  [NetworkName.Solana]: {
    standardChainId: "900",
    rangoChainId: "mainnet-beta",
    name: "SOLANA",
  },
  [NetworkName.Blast]: {
    standardChainId: "81457",
    rangoChainId: "81457",
    name: "BLAST",
  },
  [NetworkName.Telos]: {
    standardChainId: "40",
    rangoChainId: "40",
    name: "TELOS",
  },
};

let _rango: undefined | RangoClient;

/**
 * Rango token data joined with Enkrypt token data
 */
export type RangoEnkryptToken = {
  /** Rango token meta */
  rangoMeta: {
    blockchain: string
    chainId: string | null
    address: string | null
    symbol: string
    name: string | null
    decimals: number
    image: string
    blockchainImage: string
    usdPrice: number | null
    isPopular: boolean
    supportedSwappers: string[]
  },
  /** Enkrypt token */
  token?: Token
}

const rangoChainIds = new Set(Object.values(RangoPlatforms).map((k) => k.rangoChainId))

/**
 * Join Rango tokens and Enkrypt tokens to provide extra pricing and info
 * for Rango tokens in Enkrypt
 */
export function mergeRangoEnkryptTokens(
  logger: Logger,
  network: NetworkName,
  /** All Rango tokens (from rango API "meta" request) */
  allRangoTokens: readonly RangoToken[],
  /** All Enkrypt tokens on `network` */
  networkEnkryptTokens: readonly Token[],
): RangoEnkryptToken[] {
  const platform = RangoPlatforms[network]

  // We must support cross-chain swaps on this network with Rango if we want to hydrate
  // the Rango tokens with extra info
  if (!platform) {
    return []
  }

  /** Rango tokens on this network */
  const networkRangoTokens = allRangoTokens.filter((rangoToken) => rangoToken.chainId === platform.rangoChainId)

  /** Lowercase (for joining) token address (this chain) -> Rango token meta (info) */
  const networkRangoTokenMap = new Map<Lowercase<string>, RangoToken>()
  for (let i = 0, len = networkRangoTokens.length; i < len; i++) {
    const rangoToken = networkRangoTokens[i]

    // Token must be on the network we're looking at
    if (rangoToken.chainId !== platform.rangoChainId) continue

    const address = rangoToken.address ?? NATIVE_ADDRESS
    const lcAddress = address.toLowerCase() as Lowercase<string>
    if (networkRangoTokenMap.has(lcAddress)) {
      logger.swarn(
        'Duplicate Rango token address',
        'network', network,
        'address', address,
        'name', rangoToken.name,
        'symbol', rangoToken.symbol,
        'blockchain', rangoToken.blockchain,
        'decimals', rangoToken.decimals,
        'usdPrice', rangoToken.usdPrice,
        'matchingAddress', networkRangoTokenMap.get(lcAddress)?.address,
        'matchingName', networkRangoTokenMap.get(lcAddress)?.name,
        'matchingSymbol', networkRangoTokenMap.get(lcAddress)?.symbol,
        'matchingBlockchain', networkRangoTokenMap.get(lcAddress)?.blockchain,
        'matchingDecimals', networkRangoTokenMap.get(lcAddress)?.decimals,
        'matchingUsdPrice', networkRangoTokenMap.get(lcAddress)?.usdPrice,
      )
    }
    networkRangoTokenMap.set(lcAddress, rangoToken)
  }

  /** Lowercase (for joining) token address (any chain) -> Enkrypt token info */
  const networkEnkryptTokenMap = new Map<Lowercase<string>, Token>()
  for (let i = 0, len = networkEnkryptTokens.length; i < len; i++) {
    const enkryptToken = networkEnkryptTokens[i]
    const address = enkryptToken.address
    const lcAddress = address.toLowerCase() as Lowercase<string>
    if (networkEnkryptTokenMap.has(lcAddress)) {
      logger.swarn(
        'Duplicate Enkrypt token address',
        'network', network,
        'address', address,
        'name', enkryptToken.name,
      )
    }
    networkEnkryptTokenMap.set(lcAddress, enkryptToken)
  }

  const networkRangoTokenCount = networkRangoTokens.length
  const rangoEnkryptTokens: RangoEnkryptToken[] = new Array(networkRangoTokenCount)
  for (let i = 0; i < networkRangoTokenCount; i++) {
    const rangoToken = networkRangoTokens[i]
    const address = rangoToken.address ?? NATIVE_ADDRESS
    const lcAddress = address.toLowerCase() as Lowercase<string>
    const enkryptToken = networkEnkryptTokenMap.get(lcAddress)
    rangoEnkryptTokens[i] = {
      rangoMeta: rangoToken,
      token: enkryptToken,
    }
  }

  return rangoEnkryptTokens
}

export async function getRangoTokens(
  abortable: Readonly<{ signal: AbortSignal, }>,
): Promise<RangoToken[]> {
  const { signal } = abortable

  // Lazy load rango client
  let rango: RangoClient
  if (_rango) {
    rango = _rango
  } else {
    _rango = new RangoClient(RANGO_PUBLIC_API_KEY);
    rango = _rango
  }

  const meta = await rango.meta({
    excludeNonPopulars: true,
    transactionTypes: [TransactionType.EVM, TransactionType.SOLANA],
  }, { signal, })

  return meta
    .tokens
    .filter(token => token.chainId != null && rangoChainIds.has(token.chainId))
    // sort by name, ascending
    .sort((a, b) => (a.name ?? a.blockchain ?? 'aaa').localeCompare(b.name ?? b.blockchain ?? 'aaa'));
}
