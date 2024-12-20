import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pathMux } from "../../src/mux/stocks/path-mux";
import { requestMux } from "../../src/mux/request-mux";
import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { CustomExecutionContext } from "../../src/utils/middleware";
import { authPathMux } from "../../src/mux/auth/auth-path-mux";
import { keyHandler } from "../../src/handlers/keys/keys-handler";
import { billingMux } from "../../src/mux/billing/billing-path-mux";

vi.mock('../../src/mux/stocks/path-mux');
vi.mock('../../src/mux/auth/auth-path-mux');
vi.mock('../../src/mux/billing/billing-path-mux');
vi.mock('../../src/handlers/keys/keys-handler');

let ctx: CustomExecutionContext
beforeEach(() => {
  ctx = createExecutionContext()
})
afterEach(() => {
  waitOnExecutionContext(ctx)
})

afterAll(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('requestMux', () => {
  it('should route to pathMux for /stocks', async () => {

    const request = new Request('https://example.com/stocks/some-path');
    vi.mocked(pathMux).mockResolvedValue(new Response('Stocks response'));

    const response = await requestMux({ request, env, ctx });

    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe('Stocks response');
  });

  it('should route to authPathMux for /auth', async () => {
    const request = new Request('https://example.com/auth/some-path');
    vi.mocked(authPathMux).mockResolvedValue(new Response('Auth response'));

    const response = await requestMux({ request, env, ctx });

    expect(authPathMux).toHaveBeenCalledWith({ request, env, ctx });
    expect(response).toBeInstanceOf(Response);

    expect(await response.text()).toBe('Auth response');
  });

  it('should route to keyHandler for /keys', async () => {
    const request = new Request('https://example.com/keys/some-path');
    vi.mocked(keyHandler).mockResolvedValue(new Response('Keys response'));

    const response = await requestMux({ request, env, ctx });

    expect(keyHandler).toHaveBeenCalledWith({ request, env, ctx });

    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe('Keys response');
  });

  it('should route to billingMux for /billing', async () => {
    const request = new Request('https://example.com/billing/some-path');
    vi.mocked(billingMux).mockResolvedValue(new Response('Billing response'));

    const response = await requestMux({ request, env, ctx });

    expect(billingMux).toHaveBeenCalledWith({ request, env, ctx });
    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe('Billing response');
  });

  it('should return a 404 response for unknown paths', async () => {
    const request = new Request('https://example.com/unknown/some-path');

    const response = await requestMux({ request, env, ctx });

    expect(response).toBeInstanceOf(Response);

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not found');
  });
});
