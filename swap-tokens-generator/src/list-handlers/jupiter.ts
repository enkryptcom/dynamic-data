import { NetworkName, NetworkType, Token } from "@src/types";

// Jupiter is a DEX on Solana
// @see App: https://jup.ag/
// @see Documentation: https://station.jup.ag/docs/

const JUPITER_BASE = `https://tokens.jup.ag/tokens?tags=verified`

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
  const res = await fetch(`${JUPITER_BASE}tokens?tags=verified`)
  const jupiterTokens = await res.json() as JupiterToken[];

  /** Mapping of token address (on solana) -> token */
  const dict: Record<string, Token> = {}
  for (const jupiterToken of jupiterTokens) {
    dict[jupiterToken.address] = {
      address: jupiterToken.address,
      symbol: jupiterToken.symbol,
      decimals: jupiterToken.decimals,
      name: jupiterToken.name,
      logoURI: jupiterToken.logoURI,
      type: NetworkType.Solana,
      rank: undefined,
      cgId: undefined,
      price: undefined,
    }
  }

  return dict
}

export default requestJupiter;
