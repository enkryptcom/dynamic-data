import { NetworkName, NetworkType, Token } from "@src/types";

// Jupiter is a DEX on Solana
// @see App: https://jup.ag/
// @see Documentation: https://station.jup.ag/docs/

const JUPITER_BASE = `https://tokens.jup.ag/`

type JupiterToken = {
  /** @example "AVWsE5PJv3oZPzmurvD6cSwvS1x7bPhj1nFz2LMHFxoK" */
  address: string
  /** @example "lufi" */
  name: string,
  /** @example "LUFI" */
  symbol: string,
  /** @example 9 */
  decimals: number,
  /** @example "https://bafybeidokn5pg5d6iaz3jfyhbrpx6ayyl4ohqij3xvw7ghyyvm366vdfzq.ipfs.nftstorage.link" */
  logoURI: null | string,
  /** @example ["community", "verified"] */
  tags: string[]
  /** @example 25367827.699036315 */
  daily_volume: number | null,
  /** @example "Q6XprfkF8RQQKoQVG33xT88H7wi8Uk1B1CC7YAs69Gi" */
  freeze_authority: null,
  /** @example "Q6XprfkF8RQQKoQVG33xT88H7wi8Uk1B1CC7YAs69Gi" */
  mint_authority: null
}

export const supportedChains: NetworkName[] = [
  NetworkName.Solana,
];

/**
 * Request all (verified) swappable tokens on the SolanaJupiter exchange
 *
 * ```sh
 * curl 'https://tokens.jup.ag/tokens?tags=verified' -H Accept:application/json
 * ```
 */
async function requestJupiter(): Promise<Record<string, Token>> {
  let jupiterTokens: undefined | JupiterToken[];
  let attempt = 0
  const backoff = [0, 500, 1000, 2000, 4000, 8000] // 0 + 500ms + 1_000ms + 2_000ms + 4_000ms + 8_000ms = 15_500ms
  let errRef: undefined | { err: Error }
  while (!jupiterTokens) {
    try {
      // Exceeded retries
      if (attempt >= backoff.length) {
        throw new Error(`Failed to get Jupiter tokens, exceeded max retry attempts ${attempt}/${backoff.length}. Last error: ${String(errRef?.err ?? '???')}`)
      }

      // Wait before retrying
      if (backoff[attempt]) {
        console.info(`Waiting ${backoff[attempt]}ms before retrying request for Jupiter tokens`)
        await new Promise((res) => setTimeout(res, backoff[attempt]))
      }

      // Send HTTP request for jupiter tokens
      const res = await fetch(`${JUPITER_BASE}tokens?tags=verified`, {
        signal: AbortSignal.timeout(30_000),
      })

      // Response has fail status?
      if (!res.ok) {
        let msg = await res.text().catch((err) => `! Failed to decode response text: ${String(err)}`)
        const len = msg.length
        if (len > 512 + 10 + len.toString().length) msg = `${msg.slice(0, 512)}... (512/${len})`
        throw new Error(`HTTP request to get Jupiter tokens failed with ${res.status} ${res.statusText}: ${msg}`)
      }

      // Parse result
      jupiterTokens = await res.json() as JupiterToken[];

      // Santiy check
      if (!jupiterTokens) {
        throw new Error(`Failed to get Jupiter tokens, response was empty`)
      }
    } catch (err) {
      console.error(`Error requesting jupiter tokens: ${String(err)}`)
      errRef = { err: err as Error }
    }
    attempt += 1
  }

  /** Mapping of token address (on solana) -> token */
  const dict: Record<Lowercase<string>, Token> = {}
  for (const jupiterToken of jupiterTokens) {
    // Solana addresses are base58 so they're case sensitive but we'll use
    // them as dictionary keys anyway because collisions should be extremely
    // rare
    // Alternatively, the actual address stored on the token must be cased
    dict[jupiterToken.address.toLowerCase() as Lowercase<string>] = {
      address: jupiterToken.address,
      symbol: jupiterToken.symbol,
      decimals: jupiterToken.decimals,
      name: jupiterToken.name,
      logoURI: jupiterToken.logoURI ?? '', // TODO: What do I do if logoURI is not defined?
      type: NetworkType.Solana,
      rank: undefined,
      cgId: undefined,
      price: undefined,
    }
  }

  return dict
}

export default requestJupiter;
