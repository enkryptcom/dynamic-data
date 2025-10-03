import { CHAIN_CONFIGS } from "@src/configs";
import { Logger } from "@src/logger";
import { NetworkName, Token } from "@src/types";

const ONEINCH_BASE = `https://partners.mewapi.io/oneinch/v6.0/`;

export const supportedChains: NetworkName[] = [
  NetworkName.Ethereum,
  NetworkName.Binance,
  NetworkName.Matic,
  NetworkName.Optimism,
  NetworkName.Arbitrum,
  NetworkName.Gnosis,
  NetworkName.Avalanche,
  // Fantom support dropped 2025-11-03
  // NetworkName.Fantom,
  // NetworkName.Kaia,
  // NetworkName.Aurora,
  NetworkName.ZkSync,
  NetworkName.Base,
];

export async function getOneInchTokens(
  logger: Logger,
  chainName: NetworkName,
  abortable: Readonly<{ signal: AbortSignal, }>
): Promise<Map<Lowercase<string>, Token>> {
  const url = `${ONEINCH_BASE}${CHAIN_CONFIGS[chainName].chainId}/tokens`
  let resultRef: undefined | { value: { tokens: Record<string, Token> } }
  let errRef: undefined | { err: Error }
  const MAX_ATTEMPTS = 10
  const BACKOFFS = [100, 500, 1_000, 2_000, 4_000, 8_000]
  const JITTER = 1_000
  let attempt = 0
  while (!resultRef) {
    if (attempt >= MAX_ATTEMPTS) {
      logger.error(`Failed to fetch OneInch tokens for ${chainName} after ${attempt} attempts last error: ${String(errRef?.err)}`);
      if (errRef) throw errRef.err
      throw new Error(`Failed to fetch OneInch tokens for ${chainName} after ${attempt} attempts`)
    }
    attempt += 1
    if (attempt > 1) {
      const backoffMs = BACKOFFS[Math.min(attempt - 1, BACKOFFS.length - 1)] + Math.floor(Math.random() * JITTER)
      logger.info(`Waiting ${backoffMs}ms before retrying OneInch tokens fetch for ${chainName} (attempt ${attempt}/${MAX_ATTEMPTS})`)
      await new Promise<void>(function(res, rej) {
        function onTimeout() {
          cleanup()
          res()
        }
        function onAbort() {
          cleanup()
          rej(abortable!.signal!.reason)
        }
        function cleanup() {
          abortable?.signal?.removeEventListener('abort', onAbort)
          clearTimeout(timeout)
        }
        abortable?.signal?.addEventListener('abort', onAbort)
        const timeout = setTimeout(onTimeout, backoffMs)
        if (abortable?.signal?.aborted) onAbort()
      })
    }
    try {
      const res = await fetch(url, { signal: abortable?.signal })
      if (!res.ok) {
        const text = await res.text().catch((err) => `(Unable to read response: ${err})`);
        let textsm: string
        const lenstr = text.length.toString()
        const lenlen = lenstr.length
        if (text.length > 1024 + 14 + lenlen) textsm = text.slice(0, 512) + '...' + text.slice(-512) + ` (length: ${text.length})`
        else textsm = text
        throw new Error(`OneInch API error ${url} ${res.status} ${res.statusText}: ${textsm}`);
      }
      const json = await res.json()

      if (!json.tokens) {
        const text = JSON.stringify(json)
        let textsm: string
        const lenstr = text.length.toString()
        const lenlen = lenstr.length
        if (text.length > 1024 + 14 + lenlen) textsm = text.slice(0, 512) + '...' + text.slice(-512) + ` (length: ${text.length})`
        else textsm = text
        throw new Error(`OneInch API invalid response ${url} ${res.status} ${res.statusText}, no tokens field: ${textsm}`);
      }

      resultRef = { value: json as { tokens: Record<string, Token> } }


    } catch (err) {
      logger.error(`Attempt ${attempt}/${MAX_ATTEMPTS} to fetch OneInch tokens for ${chainName} failed: ${err}`);
      errRef = { err: err as Error, }
    }
  }

  const result = resultRef.value
  const addresses = Object.keys(result.tokens);
  addresses.forEach((addr) => {
    result.tokens[addr].type = CHAIN_CONFIGS[chainName].type;
  });
  const map = new Map();
  for (const [address, token] of Object.entries(result.tokens)) {
    map.set(address.toLowerCase() as Lowercase<string>, token);
  }
  return map;
}
