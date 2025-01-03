import { Logger } from "@src/logger";
import { NetworkName, NetworkType, Token } from "@src/types";

const RETRIES = [0, 500, 1000, 2000, 4000, 8000];
const TIMEOUT = 30_000;

// Jupiter is a DEX on Solana
// @see App: https://jup.ag/
// @see Documentation: https://station.jup.ag/docs/

const JUPITER_BASE = `https://tokens.jup.ag/`;

type JupiterToken = {
  /** @example "AVWsE5PJv3oZPzmurvD6cSwvS1x7bPhj1nFz2LMHFxoK" */
  address: string;
  /** @example "lufi" */
  name: string;
  /** @example "LUFI" */
  symbol: string;
  /** @example 9 */
  decimals: number;
  /** @example "https://bafybeidokn5pg5d6iaz3jfyhbrpx6ayyl4ohqij3xvw7ghyyvm366vdfzq.ipfs.nftstorage.link" */
  logoURI: null | string;
  /** @example ["community", "verified"] */
  tags: string[];
  /** @example 25367827.699036315 */
  daily_volume: number | null;
  /** @example "Q6XprfkF8RQQKoQVG33xT88H7wi8Uk1B1CC7YAs69Gi" */
  freeze_authority: null;
  /** @example "Q6XprfkF8RQQKoQVG33xT88H7wi8Uk1B1CC7YAs69Gi" */
  mint_authority: null;
};

export const supportedChains: NetworkName[] = [NetworkName.Solana];

/**
 * Request all (verified) swappable tokens on the SolanaJupiter exchange
 *
 * ```sh
 * curl 'https://tokens.jup.ag/tokens?tags=verified' -H Accept:application/json
 * ```
 */
async function requestJupiter(
  logger: Logger,
  abortable: Readonly<{ signal: AbortSignal }>,
): Promise<Map<Lowercase<string>, Token>> {
  let jupiterTokens: undefined | JupiterToken[];
  let retryidx = 0;
  let errRef: undefined | { err: Error };
  retries: while (true) {
    try {
      // Exceeded retries
      if (retryidx >= RETRIES.length) {
        throw new Error(
          `Failed to get Jupiter tokens, exceeded max retry attempts` +
          ` ${retryidx}/${RETRIES.length}. Last error:` +
          ` ${String(errRef?.err ?? "???")}`,
        );
      }

      // Wait before retrying
      if (RETRIES[retryidx]) {
        logger.sdebug(
          `Waiting before retrying request for Jupiter tokens`,
          "after",
          `${RETRIES[retryidx]}ms`,
          "retries",
          retryidx,
        );
        await new Promise<void>(function(res, rej) {
          function onTimeout() {
            cleanupTimeout();
            res();
          }
          function onAbortTimeout() {
            cleanupTimeout();
            rej(abortable.signal.reason);
          }
          function cleanupTimeout() {
            clearTimeout(timeout);
            abortable.signal.removeEventListener("abort", onAbortTimeout);
          }
          const timeout = setTimeout(onTimeout, RETRIES[retryidx]);
          abortable.signal.addEventListener("abort", onAbortTimeout);
        });
      }

      if (retryidx > 0) {
        logger.sinfo(
          "Retrying request for Jupiter tokens",
          "retries",
          retryidx,
        );
      }

      // Send HTTP request for jupiter tokens
      const url = `${JUPITER_BASE}tokens?tags=verified`
      const res = await fetch(url, {
        signal: AbortSignal.any([AbortSignal.timeout(TIMEOUT), abortable.signal]),
        headers: [
          ["Accept", "application/json"],
        ],
      });

      // Response has fail status?
      if (!res.ok) {
        let msg = await res
          .text()
          .catch((err) => `! Failed to decode response text: ${String(err)}`);
        const len = msg.length;
        if (len > 512 + 10 + len.toString().length) {
          msg = `${msg.slice(0, 512)}... (512/${len})`;
        }
        throw new Error(
          `HTTP request to get Jupiter tokens failed with` +
          ` ${res.status} ${res.statusText} ${url} ${msg}`,
        );
      }

      // Parse result
      const body = await res.json();

      jupiterTokens = body as JupiterToken[];

      // Santiy check
      if (!jupiterTokens) {
        throw new Error(`Failed to get Jupiter tokens, response was empty`);
      }

      break retries;
    } catch (err) {
      logger.swarn(
        `Error fetching Jupiter tokens`,
        "retries",
        retryidx,
        "err",
        String(err),
      );

      errRef = { err: err as Error };
    }

    retryidx += 1;
  }

  /** Mapping of token address (on solana) -> token */
  const map: Map<Lowercase<string>, Token> = new Map();
  for (const jupiterToken of jupiterTokens) {
    // Solana addresses are base58 so they're case sensitive but we'll use
    // them as dictionary keys anyway because collisions should be extremely
    // rare
    // Alternatively, the actual address stored on the token must be cased
    map.set(jupiterToken.address.toLowerCase() as Lowercase<string>, {
      address: jupiterToken.address,
      symbol: jupiterToken.symbol,
      decimals: jupiterToken.decimals,
      name: jupiterToken.name,
      logoURI: jupiterToken.logoURI ?? "", // TODO: What do I do if logoURI is not defined?
      type: NetworkType.Solana,
      rank: undefined,
      cgId: undefined,
      price: undefined,
    });
  }

  return map;
}

export default requestJupiter;
