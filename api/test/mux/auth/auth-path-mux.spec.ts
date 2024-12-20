import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomExecutionContext } from "../../../src/utils/middleware";
import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { authPathMux } from "../../../src/mux/auth/auth-path-mux";
import { tokenHandler } from "../../../src/handlers/auth/token";
import { logoutHandler } from "../../../src/handlers/auth/logout";

vi.mock('../../../src/handlers/auth/token');
vi.mock('../../../src/handlers/auth/logout');

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

describe('authPathMux', () => {
  it('should return 204 for OPTIONS requests', async () => {

    const request = new Request('https://example.com/auth', { method: 'OPTIONS' });

    const response = await authPathMux({ request, env, ctx });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
  });

  it('should route to tokenHandler for POST /auth/token', async () => {
    const request = new Request('https://example.com/auth/token', { method: 'POST' });

    vi.mocked(tokenHandler).mockResolvedValue(new Response('Token response'));

    const response = await authPathMux({ request, env, ctx });

    expect(tokenHandler).toHaveBeenCalledWith({ request, env, ctx });
    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe('Token response');
  });

  it('should route to logoutHandler for POST /auth/logout', async () => {

    const request = new Request('https://example.com/auth/logout', { method: 'POST' });
    vi.mocked(logoutHandler).mockResolvedValue(new Response('Logout response'));

    const response = await authPathMux({ request, env, ctx });

    expect(logoutHandler).toHaveBeenCalledWith({ request, env, ctx });
    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe('Logout response');
  });

  it('should return 404 for unknown POST paths', async () => {

    const request = new Request('https://example.com/auth/unknown', { method: 'POST' });

    const response = await authPathMux({ request, env, ctx });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not found');
  });

  it('should return 405 for non-POST, non-OPTIONS methods', async () => {
    const request = new Request('https://example.com/auth', { method: 'GET' });

    const response = await authPathMux({ request, env, ctx });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(405);
    expect(await response.text()).toBe('Method not allowed');
  });
});
