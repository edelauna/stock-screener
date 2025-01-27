import { createExecutionContext, env } from "cloudflare:test";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { lookupHandler } from "../../../src/handlers/etfs/lookup-handler";

describe('lookupHandler', () => {
  const mockEnv = env

  const mockCtx = createExecutionContext();

  beforeAll(async () => {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS EtfWeighting (
    symbol TEXT,
    etf_symbol TEXT,
    weighting TEXT,
    PRIMARY KEY (symbol, etf_symbol)
);`).run()
  })

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await env.DB.prepare('DELETE FROM EtfWeighting').run();
  });

  it('should return JSON response with ETF data for given symbol', async () => {
    const symbol = 'AAPL';
    await env.DB.prepare(`INSERT INTO EtfWeighting (symbol, etf_symbol, weighting)
          VALUES ('AAPL', 'VOO', '0.03'), ('AAPL', 'SPY', '0.06')`).run()
    const mockResults = [
      { symbol: 'AAPL', etf_symbol: 'SPY', weighting: '0.06' },
      { symbol: 'AAPL', etf_symbol: 'VOO', weighting: '0.03' },
    ];

    // Mock the lookupSymbolInEtf function to return the mock results

    const request = new Request(`https://example.com?symbol=${symbol}`);
    const response = await lookupHandler({ request, env: mockEnv, ctx: mockCtx });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(mockResults);
  });

  it('should return empty array when no symbol is provided', async () => {
    const request = new Request('https://example.com');
    const response = await lookupHandler({ request, env: mockEnv, ctx: mockCtx });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});