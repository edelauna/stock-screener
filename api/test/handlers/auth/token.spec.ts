import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomExecutionContext } from "../../../src/utils/middleware";
import { createExecutionContext, env, fetchMock, waitOnExecutionContext } from "cloudflare:test";
import { generateCustomerJwtSafely } from "../../../src/utils/billing";
import { tokenHandler } from "../../../src/handlers/auth/token";
import { internalServerError } from "../../../src/utils/errors";

vi.mock('../../../src/utils/billing');
vi.mock('../../../src/utils/errors');
vi.mock('../../../src/utils/tokens');

let ctx: CustomExecutionContext;

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

beforeEach(() => {
  ctx = createExecutionContext();
});

afterEach(() => {
  waitOnExecutionContext(ctx);
  fetchMock.assertNoPendingInterceptors();
});

afterAll(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('tokenHandler', () => {
  it('should handle token exchange and set cookies correctly', async () => {
    const code = 'example-code';
    const verifier = { value: 'example-verifier', expiry: Date.now() + 3600000 };
    const request = new Request('https://example.com/auth/token', {
      method: 'POST',
      body: JSON.stringify({ code, verifier }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mockEnv = {
      ...env,
      AZURE_AD_TOKEN_URL: 'https://login.microsoftonline.com/token',
      AZURE_SPA_CLIENT_ID: 'client-id',
      AZURE_SPA_REDIRECT_URI: 'https://example.com/redirect',
    };

    fetchMock.get('https://login.microsoftonline.com')
      .intercept({
        path: '/token',
        method: 'POST',
      }).reply(200, {
        access_token: 'access-token',
        id_token: 'id-token',
        refresh_token: 'refresh-token',
      })

    vi.mocked(generateCustomerJwtSafely).mockResolvedValue('customer-jwt');

    const response = await tokenHandler({ request, env: mockEnv, ctx });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toEqual({
      id_token: 'id-token',
      customer_token: 'customer-jwt',
    });

    const setCookieHeaders = response.headers.getSetCookie();

    expect(setCookieHeaders).toHaveLength(3);

    expect(setCookieHeaders[0]).toBe('access_token=access-token; Path=/; HttpOnly; Samesite=Strict');
    expect(setCookieHeaders[1]).toBe('refresh_token=refresh-token; Path=/; HttpOnly; SameSite=Strict');
    expect(setCookieHeaders[2]).toBe('customer=customer-jwt; Path=/; HttpOnly; SameSite=Strict');

    expect(generateCustomerJwtSafely).toHaveBeenCalledWith('access-token', mockEnv, ctx);
  });

  it('should handle fetch error', async () => {
    const code = 'example-code';
    const verifier = { value: 'example-verifier', expiry: Date.now() + 3600000 };

    const request = new Request('https://example.com/auth/token', {
      method: 'POST',
      body: JSON.stringify({ code, verifier }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mockEnv = {
      ...env,
      AZURE_AD_TOKEN_URL: 'https://login.microsoftonline.com/token',
      AZURE_SPA_CLIENT_ID: 'client-id',
      AZURE_SPA_REDIRECT_URI: 'https://example.com/redirect',
    };

    fetchMock.get('https://login.microsoftonline.com')
      .intercept({
        path: '/token',
        method: 'POST'
      }).reply(500, 'Error message')

    vi.mocked(internalServerError).mockResolvedValue(new Response('Internal Server Error', { status: 500 }));

    const response = await tokenHandler({ request, env: mockEnv, ctx });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(500);

    expect(await response.text()).toBe('Internal Server Error');

    expect(internalServerError).toHaveBeenCalledWith('Error message', { status: 500, statusTest: 'Internal Server Error' });
  });

  it('should handle JSON parsing error', async () => {
    const request = new Request('https://example.com/auth/token', {
      method: 'POST',
      body: 'invalid-json',
      headers: { 'Content-Type': 'application/json' },
    });

    const mockEnv = {
      ...env,
      AZURE_AD_TOKEN_URL: 'https://login.microsoftonline.com/token',
      AZURE_SPA_CLIENT_ID: 'client-id',
      AZURE_SPA_REDIRECT_URI: 'https://example.com/redirect',
    };

    vi.mocked(internalServerError).mockResolvedValue(new Response('Internal Server Error', { status: 500 }));

    const response = await tokenHandler({ request, env: mockEnv, ctx });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Internal Server Error');

    expect(internalServerError).toHaveBeenCalledWith(expect.stringContaining('Unexpected token'));
  });
});
