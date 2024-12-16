import { balanceSheetHandler } from "../../handlers/stocks/balance-sheet";
import { marketStatus } from "../../handlers/stocks/market-status";
import { searchSymbolHandler } from "../../handlers/stocks/symbol-search";
import { timeSeriesDaily } from "../../handlers/stocks/time-series-daily";
import { RequestMuxProperties } from "../request-mux";

export const pathMux = async ({ request, ...etc }: RequestMuxProperties): Promise<Response> => {
  const workerArgs = { request, ...etc }
  const url = new URL(request.url);
  const fn = url.searchParams.get('fn');

  switch (fn) {
    case 'SYMBOL_SEARCH':
      const keywords = url.searchParams.get('keywords')
      return searchSymbolHandler({ fn, keywords, workerArgs })
    case 'TIME_SERIES_DAILY_ADJUSTED': return (() => {
      const symbol = url.searchParams.get('symbol') ?? ""
      const outputsize = url.searchParams.get('outputsize') ?? ""
      return timeSeriesDaily({ fn, symbol, outputsize, workerArgs })
    })()
    case 'MARKET_STATUS':
      return marketStatus({ fn, workerArgs })
    case 'BALANCE_SHEET': return (() => {
      const symbol = url.searchParams.get('symbol') ?? ""
      return balanceSheetHandler({ fn, symbol, workerArgs })
    })()
    default:
      return new Response("Not found", {
        status: 404
      })
  }
}
