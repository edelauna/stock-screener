import { describe, it, expect, beforeEach, vi, afterAll } from 'vitest';
import { createExecutionContext, env } from 'cloudflare:test';
import { etfMux } from '../../../src/mux/etf/etf-mux';
import { websocketHandler } from '../../../src/handlers/etfs/websocket-handler';
import { lookupHandler } from '../../../src/handlers/etfs/lookup-handler';

vi.mock('../../../src/handlers/etfs/lookup-handler');
vi.mock('../../../src/handlers/etfs/websocket-handler');

describe('etfMux', () => {
  const mockEnv = env;
  const mockCtx = createExecutionContext();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should route to websocketHandler for /ws path', async () => {
    const request = new Request('https://example.com/etf/ws');
    const mockResponse = new Response(null, {status: 200})
    vi.mocked(websocketHandler).mockResolvedValue(mockResponse)
    const response = await etfMux({ request, env: mockEnv, ctx: mockCtx });
    expect(websocketHandler).toHaveBeenCalledWith({
      request,
      env: mockEnv,
      ctx: mockCtx,
    });
    expect(response).toBe(mockResponse)
  });

  it('should route to lookupHandler for /lookup path', async () => {
    const request = new Request('https://example.com/etf/lookup');
    const mockResponse = new Response('Lookup response', { status: 200 });
    vi.mocked(lookupHandler).mockResolvedValue(mockResponse);

    const response = await etfMux({ request, env: mockEnv, ctx: mockCtx });

    expect(lookupHandler).toHaveBeenCalledWith({
      request,
      env: mockEnv,
      ctx: mockCtx,
    });
    expect(response).toBe(mockResponse);
  });
  it('should return 404 Not Found for unknown paths', async () => {
    const request = new Request('https://example.com/unknown');
    const response = await etfMux({ request, env: mockEnv, ctx: mockCtx });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not found');
    expect(lookupHandler).not.toHaveBeenCalled();
    expect(websocketHandler).not.toHaveBeenCalled();
  });
});