import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomExecutionContext } from "../../../src/utils/middleware";
import { createExecutionContext, env, fetchMock, waitOnExecutionContext } from "cloudflare:test";
import { Customer, generateCustomerJwt, pluckCustomerFields, stripeFetchWrapper } from "../../../src/utils/billing";
import { handleMange, handleRedirected, handleUpdate } from "../../../src/handlers/billing/billing-handler";
import { internalServerError } from "../../../src/utils/errors";

vi.mock('../../../src/utils/billing');
vi.mock('../../../src/utils/errors');

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

describe('handleMange', () => {
  it('should create a billing portal session', async () => {
    const mockEnv = {
      ...env,
      ALLOWED_ORIGIN: 'https://example.com',
    };

    ctx.customer = { id: 'cus_123', object: 'customer', metadata: {} };

    vi.mocked(stripeFetchWrapper).mockResolvedValue(Response.json({ url: 'https://billing.stripe.com/session' }));

    const response = await handleMange({ request: new Request('http://dne'), ctx, env: mockEnv });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toEqual({ url: 'https://billing.stripe.com/session' });
  });

  it('should return 400 for missing customer', async () => {
    const mockEnv = {
      ...env,
      ALLOWED_ORIGIN: 'https://example.com',
    };
    const request = new Request('http://any.com')
    const response = await handleMange({ request, ctx, env: mockEnv });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(400);

    expect(await response.text()).toBe('Bad data');
  });

  it('should handle Stripe API error', async () => {
    const mockEnv = {
      ...env,
      ALLOWED_ORIGIN: 'https://example.com',
    };

    ctx.customer = { id: 'cus_123', object: 'customer', metadata: {} };

    vi.mocked(stripeFetchWrapper).mockResolvedValue(new Response('Stripe error message', { status: 500, statusText: 'Internal Server Error' }));
    vi.mocked(internalServerError).mockResolvedValue(new Response('Internal Server Error', { status: 500 }));

    const request = new Request('http://any.com')
    const response = await handleMange({ request, ctx, env: mockEnv });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Internal Server Error');

    expect(internalServerError).toHaveBeenCalledWith('Response not ok', {
      body: 'Stripe error message',
    });
  });
});

describe('handleRedirected', () => {
  it('should handle redirected request and update customer', async () => {
    ctx.user = { oid: 'user-oid' } as CustomExecutionContext["user"];

    const request = new Request('https://example.com/managed_redirected?checkout_session_id=cs_123');

    vi.mocked(stripeFetchWrapper).mockResolvedValueOnce(Response.json({ customer: { id: 'cus_123', subscriptions: [] } }))
      .mockResolvedValueOnce(Response.json({ ok: true }))
    vi.mocked(pluckCustomerFields).mockReturnValue({
      id: 'cus_123',
      object: 'customer',
      metadata: { oid: 'user-oid' },
      subscriptions: {
        data: []
      }
    });
    vi.mocked(generateCustomerJwt).mockResolvedValue('customer-jwt');

    const response = await handleRedirected({ request, ctx, env });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toEqual({ customer_token: 'customer-jwt' });

    const setCookieHeaders = response.headers.getSetCookie();
    expect(setCookieHeaders).toHaveLength(1);
    expect(setCookieHeaders[0]).toBe('customer=customer-jwt; Path=/; HttpOnly; SameSite=Strict');

    expect(pluckCustomerFields).toHaveBeenCalledWith({ id: 'cus_123', subscriptions: [] });
    expect(generateCustomerJwt).toHaveBeenCalledWith(env, ctx);
  });

  it('should handle missing checkoutSessionId', async () => {
    ctx.user = { oid: 'user-oid' } as CustomExecutionContext["user"];

    const request = new Request('https://example.com/managed_redirected');

    vi.mocked(internalServerError).mockResolvedValue(new Response('Internal Server Error', { status: 500 }));

    const response = await handleRedirected({ request, ctx, env });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Internal Server Error');

    expect(internalServerError).toHaveBeenCalledWith('missing checkoutSessionId');
  });

  it('should handle missing user oid', async () => {
    const request = new Request('https://example.com/managed_redirected?checkout_session_id=cs_123');

    vi.mocked(internalServerError).mockResolvedValue(new Response('Internal Server Error', { status: 500 }));

    const response = await handleRedirected({ request, ctx, env });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Internal Server Error');

    expect(internalServerError).toHaveBeenCalledWith('no oid found for user');
  });

  it('should handle Stripe API error for checkout session', async () => {
    ctx.user = { oid: 'user-oid' } as CustomExecutionContext["user"];

    const request = new Request('https://example.com/managed_redirected?checkout_session_id=cs_123');

    vi.mocked(stripeFetchWrapper).mockResolvedValue(new Response('Stripe error message', {
      status: 500,
      statusText: 'Internal Server Error'
    }));
    vi.mocked(internalServerError).mockResolvedValue(new Response('Internal Server Error', { status: 500 }));

    const response = await handleRedirected({ request, ctx, env });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Internal Server Error');

    expect(internalServerError).toHaveBeenCalledWith('checkoutResponse was not ok', { text: 'Stripe error message' });
  });
});

describe('handleUpdate', () => {
  it('should update customer and generate JWT', async () => {
    ctx.customer = { id: 'cus_123' } as Customer;

    vi.mocked(stripeFetchWrapper).mockResolvedValue(Response.json({ id: 'cus_123', subscriptions: [] }));
    vi.mocked(pluckCustomerFields).mockReturnValue({
      id: 'cus_123',
      object: 'customer',
      metadata: { oid: 'user-oid' },
      subscriptions: {
        data: []
      }
    });
    vi.mocked(generateCustomerJwt).mockResolvedValue('customer-jwt');

    const request = new Request('http://any.com')
    const response = await handleUpdate({ request, ctx, env });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toEqual({ customer_token: 'customer-jwt' });

    const setCookieHeaders = response.headers.getSetCookie();
    expect(setCookieHeaders).toHaveLength(1);
    expect(setCookieHeaders[0]).toBe('customer=customer-jwt; Path=/; HttpOnly; SameSite=Strict');

    expect(pluckCustomerFields).toHaveBeenCalledWith({ id: 'cus_123', subscriptions: [] });
    expect(generateCustomerJwt).toHaveBeenCalledWith(env, ctx);
  });

  it('should handle missing customer id', async () => {
    vi.mocked(internalServerError).mockResolvedValue(new Response('Internal Server Error', { status: 500 }));

    const request = new Request('http://any.com')
    const response = await handleUpdate({ request, ctx, env });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Internal Server Error');

    expect(internalServerError).toHaveBeenCalledWith('no customer_id found.', null, {
      message: "Customer Id not provided"
    }, 403);
  });

  it('should handle Stripe API error', async () => {
    ctx.customer = { id: 'cus_123' } as Customer;

    const mockStripeFetchWrapper = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('Stripe error message'),
    });

    vi.mocked(stripeFetchWrapper).mockImplementation(mockStripeFetchWrapper);
    vi.mocked(internalServerError).mockResolvedValue(new Response('Internal Server Error', { status: 500 }));

    const request = new Request('http://any.com')
    const response = await handleUpdate({ request, ctx, env });

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Internal Server Error');

    expect(internalServerError).toHaveBeenCalledWith('customerResponse was not ok', { text: 'Stripe error message' });
  });
});
