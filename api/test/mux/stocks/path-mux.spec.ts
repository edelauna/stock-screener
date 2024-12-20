import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomExecutionContext } from "../../../src/utils/middleware";
import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { searchSymbolHandler } from "../../../src/handlers/stocks/symbol-search";
import { pathMux } from "../../../src/mux/stocks/path-mux";
import { timeSeriesDaily } from "../../../src/handlers/stocks/time-series-daily";
import { marketStatus } from "../../../src/handlers/stocks/market-status";
import { balanceSheetHandler } from "../../../src/handlers/stocks/balance-sheet";

vi.mock('../../../src/handlers/stocks/symbol-search');
vi.mock('../../../src/handlers/stocks/time-series-daily');
vi.mock('../../../src/handlers/stocks/market-status');
vi.mock('../../../src/handlers/stocks/balance-sheet');

let ctx: CustomExecutionContext;
beforeEach(() => {
  ctx = createExecutionContext();
});

afterEach(() => {
  waitOnExecutionContext(ctx);
});

afterAll(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('pathMux', () => {
  it('should route to searchSymbolHandler for SYMBOL_SEARCH', async () => {
    const request = new Request('https://example.com/stocks?fn=SYMBOL_SEARCH&keywords=example');

    vi.mocked(searchSymbolHandler).mockResolvedValue(new Response('Symbol search response'));

    const response = await pathMux({ request, env, ctx });

    expect(searchSymbolHandler).toHaveBeenCalledWith({
      fn: 'SYMBOL_SEARCH',
      keywords: 'example',
      workerArgs: { request, env, ctx }
    });
    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe('Symbol search response');
  });

  it('should route to timeSeriesDaily for TIME_SERIES_DAILY_ADJUSTED', async () => {
    const request = new Request('https://example.com/stocks?fn=TIME_SERIES_DAILY_ADJUSTED&symbol=ABC&outputsize=full');
    vi.mocked(timeSeriesDaily).mockResolvedValue(new Response('Time series daily response'));

    const response = await pathMux({ request, env, ctx });

    expect(timeSeriesDaily).toHaveBeenCalledWith({
      fn: 'TIME_SERIES_DAILY_ADJUSTED',
      symbol: 'ABC',

      outputsize: 'full',
      workerArgs: { request, env, ctx }
    });
    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe('Time series daily response');
  });

  it('should route to marketStatus for MARKET_STATUS', async () => {
    const request = new Request('https://example.com/stocks?fn=MARKET_STATUS');
    vi.mocked(marketStatus).mockResolvedValue(new Response('Market status response'));

    const response = await pathMux({ request, env, ctx });

    expect(marketStatus).toHaveBeenCalledWith({
      fn: 'MARKET_STATUS',
      workerArgs: { request, env, ctx }
    });
    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe('Market status response');
  });

  it('should route to balanceSheetHandler for BALANCE_SHEET', async () => {
    const request = new Request('https://example.com/stocks?fn=BALANCE_SHEET&symbol=DEF');

    vi.mocked(balanceSheetHandler).mockResolvedValue(new Response('Balance sheet response'));

    const response = await pathMux({ request, env, ctx });

    expect(balanceSheetHandler).toHaveBeenCalledWith({
      fn: 'BALANCE_SHEET',
      symbol: 'DEF',
      workerArgs: { request, env, ctx }
    });
    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe('Balance sheet response');
  });

  it('should return a 404 response for unknown functions', async () => {
    const request = new Request('https://example.com/stocks?fn=UNKNOWN_FUNCTION');

    const response = await pathMux({ request, env, ctx });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not found');
  });
});
