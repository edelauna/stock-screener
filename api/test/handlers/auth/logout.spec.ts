import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomExecutionContext } from "../../../src/utils/middleware";
import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { logoutHandler } from "../../../src/handlers/auth/logout";

let ctx: CustomExecutionContext;
beforeEach(() => {
  ctx = createExecutionContext();
});

afterEach(() => {
  waitOnExecutionContext(ctx);
});

describe('logoutHandler', () => {
  it('should handle logout and set cookies correctly', async () => {
    const id_token = 'example-id-token';
    const request = new Request('https://example.com/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ id_token }),

      headers: { 'Content-Type': 'application/json' },
    });

    const mockEnv = {
      ...env,
      AZURE_AD_LOGOUT_URL: 'https://login.microsoftonline.com/logout',
      AZURE_SPA_REDIRECT_URI: 'https://example.com/redirect',
    };

    const response = await logoutHandler({ request, env: mockEnv, ctx });


    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toEqual({

      redirect_uri: 'https://login.microsoftonline.com/logout?id_token_hint=example-id-token&post_logout_redirect_uri=https://example.com/redirect',
    });

    const setCookieHeaders = response.headers.getSetCookie();
    expect(setCookieHeaders).toHaveLength(3);

    expect(setCookieHeaders[0]).toBe('access_token=; Path=/; Max-Age=0; HttpOnly; Samesite=Strict');
    expect(setCookieHeaders[1]).toBe('refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict');

    expect(setCookieHeaders[2]).toBe('customer=; Path=/; Max-Age=0; SameSite=Strict');
  });

  it('should handle invalid JSON input', async () => {
    const request = new Request('https://example.com/auth/logout', {
      method: 'POST',
      body: 'invalid-json',
      headers: { 'Content-Type': 'application/json' },
    });

    const mockEnv = {
      ...env,
      AZURE_AD_LOGOUT_URL: 'https://login.microsoftonline.com/logout',
      AZURE_SPA_REDIRECT_URI: 'https://example.com/redirect',
    };

    await expect(logoutHandler({ request, env: mockEnv, ctx })).rejects.toThrow();
  });
});
