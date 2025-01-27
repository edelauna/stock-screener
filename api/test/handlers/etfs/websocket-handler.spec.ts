import { describe, it, expect, beforeEach, vi } from 'vitest';
import { env, createExecutionContext } from 'cloudflare:test';
import { websocketHandler } from '../../../src/handlers/etfs/websocket-handler';

describe('websocketHandler', () => {
  const mockEnv = {
    ...env,
    ETF_API_KEY: 'test123'
  };
  const mockCtx = createExecutionContext();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 Unauthorized when ETF API key is missing or incorrect', async () => {
    const request = new Request('https://example.com');
    const response = await websocketHandler({ request, env: mockEnv, ctx: mockCtx });
    expect(response.status).toBe(401);
    expect(await response.text()).toBe('Unauthorized');
    const requestWithIncorrectKey = new Request('https://example.com?etf_key=wrong_key');
    const responseWithIncorrectKey = await websocketHandler({ request: requestWithIncorrectKey, env: mockEnv, ctx: mockCtx });
    expect(responseWithIncorrectKey.status).toBe(401);
    expect(await responseWithIncorrectKey.text()).toBe('Unauthorized');
  });

  it('should return 400 Expected websocket when Upgrade header is missing or incorrect', async () => {
    const request = new Request('https://example.com?etf_key=' + mockEnv.ETF_API_KEY);
    const response = await websocketHandler({ request, env: mockEnv, ctx: mockCtx });
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Expected websocket');

    const requestWithIncorrectUpgrade = new Request('https://example.com?etf_key=' + mockEnv.ETF_API_KEY, {
      headers: { Upgrade: 'incorrect' }
    });
    const responseWithIncorrectUpgrade = await websocketHandler({ request: requestWithIncorrectUpgrade, env: mockEnv, ctx: mockCtx });
    expect(responseWithIncorrectUpgrade.status).toBe(400);
    expect(await responseWithIncorrectUpgrade.text()).toBe('Expected websocket');
  });

  it('should successfully upgrade to WebSocket when conditions are met', async () => {
    const request = new Request('https://example.com?etf_key=' + mockEnv.ETF_API_KEY, {
      headers: { Upgrade: 'websocket' }
    });
    const response = await websocketHandler({ request, env: mockEnv, ctx: mockCtx });
    expect(response.status).toBe(101);
    expect(response.webSocket).toBeDefined();
  });
});