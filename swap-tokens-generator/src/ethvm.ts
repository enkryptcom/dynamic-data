import { Logger } from "./logger";

const ETHVM_BASE = `https://api-v3.ethvm.dev/`;
const MAX_CHUNK_SIZE = 100;
const RETRIES = [0, 500, 1_000, 2_000, 5_000];
const TIMEOUT = 30_000;

export async function getEthVMPriceByIDs(
  logger: Logger,
  /** CoinGecko ids */
  cgids: readonly string[],
  abortable: Readonly<{ signal: AbortSignal }>,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (
    let chunkidx = 0, idcount = cgids.length;
    chunkidx < idcount;
    chunkidx += MAX_CHUNK_SIZE
  ) {
    /** CoinGecko ids */
    const chunk = cgids.slice(chunkidx, chunkidx + MAX_CHUNK_SIZE);
    /** Number of CoinGecko ids in this chunk */
    const chunkSize = chunk.length;

    /** API query result */
    let result: any;
    let errref: undefined | { err: Error };
    let retryidx = 0;
    retires: while (true) {
      if (retryidx >= RETRIES.length) {
        logger.swarn(
          `Exceeded maximum number of attempts trying to fetch CoinGecko price data from EthVM`,
          "chunkSize", chunkSize,
          "chunkidx", chunkidx,
          "idcount", idcount,
          "retries", retryidx,
        );
        throw errref!.err;
      }
      if (RETRIES[retryidx]) {
        logger.sdebug(
          `Waiting before retrying fetch CoinGecko price data from EthVM`,
          "after", `${RETRIES[retryidx]}ms`,
          "chunkSize", chunkSize,
          "chunkidx", chunkidx,
          "idcount", idcount,
          "retries", retryidx,
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
          `Retrying fetch CoinGecko price data from EthVM`,
          "after", `${RETRIES[retryidx]}ms`,
          "chunkSize", chunkSize,
          "chunkidx", chunkidx,
          "idcount", idcount,
          "retries", retryidx,
        );
      }

      try {
        const res = await fetch(ETHVM_BASE, {
          method: "POST",
          signal: AbortSignal.any([AbortSignal.timeout(TIMEOUT), abortable.signal]),
          keepalive: true,
          headers: [
            ["Content-Type", "application/json"],
            ["Accept", "application/json"],
          ],
          body: JSON.stringify({
            operationName: null,
            variables: { ids: chunk },
            query: /* GraphQL */ `
query ($ids: [String!]!) {
  getCoinGeckoTokenMarketDataByIds(coinGeckoTokenIds: $ids) {
    current_price
  }
}
              `,
          }),
        });

        if (!res.ok) {
          let text = await res.text().catch((err) => `! Failed to decode response text: ${err}`);
          const len = text.length;
          if (len > 512 + 10 + len.toString().length) text = text.slice(0, 512) + `... (512/${len})`;
          let idsText: string;
          if (chunkSize > 10) idsText = chunk.slice(0, 10).join(", ") + `... (10/${chunkSize})`;
          else idsText = chunk.join(", ");
          throw new Error(
            `Failed to fetch CoinGecko price data from EthVM for ${chunkSize}` +
            ` tokens (${idsText}) with ${res.status} ${res.statusText}: ${text}`,
          );
        }

        result = await res.json();
        // Success
        break retires;
      } catch (err) {
        logger.swarn(
          `Errored fetching CoinGecko price data from EthVM`,
          "chunkSize", chunkSize,
          "chunkidx", chunkidx,
          "idcount", idcount,
          "retries", retryidx,
          "err", String(err),
        );
        errref = { err: err as Error };
      }
      retryidx++;
    } // Retry loop

    if (result.errors && result.errors.length) {
      let msg = result.errors.map((err: any) => String(err?.message ?? '???')).join(', ')
      const len = msg.length
      if (len > 512 + 10 + len.toString().length) msg = `${msg.slice(0, 512)}... (512/${len})`
      throw new Error(
        `Failed to fetch CoinGecko price data from EthVM: ${len} GraphQL error/s: ${msg}`
      )
    }

    if (result.data.getCoinGeckoTokenMarketDataByIds.length !== chunkSize) {
      let text = JSON.stringify(result);
      if (text.length > 512 + 10)
        text = text.slice(0, 512) + `... (512/${text.length})`;
      throw new Error(
        `Failed to fetch CoinGecko price data from EthVM: Token count mismatch` +
        ` ${result.data.getCoinGeckoTokenMarketDataByIds.length} !== ${chunkSize}.` +
        ` API Result: ${text}`,
      );
    }

    for (let ididx = 0; ididx < chunkSize; ididx++) {
      const cgid = chunk[ididx];
      const current_price =
        result.data.getCoinGeckoTokenMarketDataByIds[ididx]?.current_price;
      if (!(current_price == null || typeof current_price === "number")) {
        throw new Error(
          `Failed to fetch CoinGecko price data from EthVM: Unexpected type of current_price` +
          ` ${current_price} for token ${cgid} (${ididx}, ${chunkidx})`,
        );
      }
      if (map.has(cgid)) {
        logger.swarn(
          "Duplicate CoinGecko id in price data requested / returned from EthVM",
          "cgid", cgid,
          "ididx", ididx,
          "chunkidx", chunkidx,
          "chunkSize", chunkSize,
          "current_price", current_price,
          "map.get(cgid)<price>", map.get(cgid),
        );
      }
      if (current_price != null) {
        map.set(cgid, current_price);
      }
    }
  } // Chunk loop

  return map;
}
