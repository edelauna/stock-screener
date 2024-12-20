import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomExecutionContext } from "../../../src/utils/middleware";
import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { handleMange, handleRedirected, handleUpdate } from "../../../src/handlers/billing/billing-handler";
import { billingMux } from "../../../src/mux/billing/billing-path-mux";

vi.mock('../../../src/handlers/billing/billing-handler');

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

describe('billingMux', () => {
  it('should route to handleMange for /billing/manage', async () => {

    const request = new Request('https://example.com/billing/manage');
    vi.mocked(handleMange).mockResolvedValue(new Response('Manage response'));

    const response = await billingMux({ request, env, ctx });

    expect(handleMange).toHaveBeenCalledWith({ request, env, ctx });
    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe('Manage response');
  });

  it('should route to handleRedirected for /billing/redirected', async () => {

    const request = new Request('https://example.com/billing/redirected');
    vi.mocked(handleRedirected).mockResolvedValue(new Response('Redirected response'));

    const response = await billingMux({ request, env, ctx });

    expect(handleRedirected).toHaveBeenCalledWith({ request, env, ctx });
    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe('Redirected response');
  });

  it('should route to handleUpdate for /billing/refresh', async () => {
    const request = new Request('https://example.com/billing/refresh');
    vi.mocked(handleUpdate).mockResolvedValue(new Response('Update response'));

    const response = await billingMux({ request, env, ctx });

    expect(handleUpdate).toHaveBeenCalledWith({ request, env, ctx });
    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe('Update response');
  });

  it('should return a 404 response for unknown paths', async () => {
    const request = new Request('https://example.com/billing/unknown');

    const response = await billingMux({ request, env, ctx });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not found');
  });
});
