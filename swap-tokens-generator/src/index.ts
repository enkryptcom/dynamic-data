import { writeFileSync } from "fs";
import oneInch, {
  supportedChains as oneInchSupportedChains,
} from "./list-handlers/oneInch";
import parawap, {
  supportedChains as paraswapSupportedChains,
} from "./list-handlers/paraswap";
import coingecko, {
  supportedChains as cgSupportedChains,
} from "./list-handlers/coingecko";
import { NetworkName, Token } from "./types";

const runner = async () => {
  const oneInchTokens: Record<string, Record<string, Token>> = {};
  const paraswapTokens: Record<string, Record<string, Token>> = {};
  const coingeckoTokens: Record<string, Record<string, Token>> = {};
  const allChains = Object.values(NetworkName);
  const cgPromises = cgSupportedChains.map((chain, idx) =>
    coingecko(chain).then((results) => {
      coingeckoTokens[cgSupportedChains[idx]] = results;
    })
  );
  const oneInchPromises = oneInchSupportedChains.map((chain, idx) =>
    oneInch(chain).then((results) => {
      oneInchTokens[oneInchSupportedChains[idx]] = results;
    })
  );
  const paraswapPromises = paraswapSupportedChains.map((chain, idx) =>
    parawap(chain).then((results) => {
      paraswapTokens[paraswapSupportedChains[idx]] = results;
    })
  );
  Promise.all(cgPromises.concat(oneInchPromises).concat(paraswapPromises)).then(
    () => {
      const allResults = [coingeckoTokens, oneInchTokens, paraswapTokens];
      allChains.forEach((chain) => {
        const tokens: Token[] = [];
        const includedTokens: string[] = [];
        const addTokensIfNotAdded = (items: Record<string, Token>) => {
          const addresses = Object.keys(items);
          addresses.forEach((address) => {
            if (!includedTokens.includes(address))
              tokens.push({
                address: items[address].address,
                decimals: items[address].decimals,
                logoURI: items[address].logoURI,
                name: items[address].name,
                symbol: items[address].symbol,
              });
            includedTokens.push(address);
          });
        };
        allResults.forEach((res) => {
          if (res[chain]) addTokensIfNotAdded(res[chain]);
        });
        writeFileSync(`./dist/lists/${chain}.json`, JSON.stringify(tokens));
      });
    }
  );
};
runner();
