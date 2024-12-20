import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomExecutionContext } from "../../src/utils/middleware";
import { createExecutionContext, env, fetchMock, waitOnExecutionContext } from "cloudflare:test";
import { Customer, generateCustomerJwt, generateCustomerJwtSafely, planGuard, pluckCustomerFields, stripeFetchWrapper } from "../../src/utils/billing";
import { signMessage } from "../../src/utils/cookies";
import { verify } from "../../src/utils/jwt";
import { internalServerError } from "../../src/utils/errors";

vi.mock('../../src/utils/cookies');
vi.mock('../../src/utils/errors');
vi.mock('../../src/utils/jwt');

let ctx: CustomExecutionContext;
beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

beforeEach(() => {
  ctx = createExecutionContext();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
  waitOnExecutionContext(ctx);
});

afterAll(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('planGuard', () => {
  it('should return true if the plan is found', () => {
    ctx.customer = {
      id: 'cus_123',
      object: 'customer',
      metadata: {},
      subscriptions: {
        data: [
          {
            items: {
              data: [
                { plan: { id: 'plan_1' } },
                { plan: { id: 'plan_2' } },
              ],

            },
          },
        ],
      },
    };

    expect(planGuard('plan_1', ctx)).toBe(true);
    expect(planGuard('plan_2', ctx)).toBe(true);
    expect(planGuard('plan_3', ctx)).toBe(false);
  });

  it('should return false if no customer or subscriptions', () => {
    expect(planGuard('plan_1', ctx)).toBe(false);

    ctx.customer = { id: 'cus_123', object: 'customer', metadata: {} };
    expect(planGuard('plan_1', ctx)).toBe(false);
  });
});

describe('pluckCustomerFields', () => {
  it('should pluck the correct fields from a customer object', () => {
    const customer: Customer = {
      id: 'cus_123',
      object: 'customer',
      metadata: { oid: 'user-oid' },
      subscriptions: {
        data: [
          {
            items: {
              data: [
                { plan: { id: 'plan_1' } },
                { plan: { id: 'plan_2' } },
              ],
            },
          },
        ],
      },
    };

    const result = pluckCustomerFields(customer);

    expect(result).toEqual({
      id: 'cus_123',
      object: 'customer',
      metadata: { oid: 'user-oid' },
      subscriptions: {
        data: [
          {
            items: {
              data: [
                { plan: { id: 'plan_1' } },
                { plan: { id: 'plan_2' } },
              ],
            },
          },
        ],
      },
    });
  });

  it('should handle customer without subscriptions', () => {
    const customer: Customer = {
      id: 'cus_123',
      object: 'customer',
      metadata: { oid: 'user-oid' },
    };

    const result = pluckCustomerFields(customer);

    expect(result).toEqual({
      id: 'cus_123',
      object: 'customer',
      metadata: { oid: 'user-oid' },
      subscriptions: { data: [] },
    });
  });
});

describe('generateCustomerJwt', () => {
  it('should generate a customer JWT when all data is present', async () => {
    ctx.user = { oid: 'user-oid' } as CustomExecutionContext["user"];
    ctx.customer = { id: 'cus_123', object: 'customer', metadata: {} };

    vi.mocked(signMessage).mockResolvedValue('signed-jwt');

    const result = await generateCustomerJwt(env, ctx);

    expect(result).toBe('signed-jwt');
    expect(signMessage).toHaveBeenCalledWith({ oid: 'user-oid', customer: ctx.customer }, env);

  });

  it('should return blank cookie if no oid', async () => {
    ctx.customer = { id: 'cus_123', object: 'customer', metadata: {} };

    const result = await generateCustomerJwt(env, ctx);

    expect(result).toBe('customer=; Path=/; Max-Age=0; SameSite=Strict');
  });

  it('should return blank cookie if no customer', async () => {
    ctx.user = { oid: 'user-oid' } as CustomExecutionContext["user"];

    const result = await generateCustomerJwt(env, ctx);

    expect(result).toBe('customer=; Path=/; Max-Age=0; SameSite=Strict');
  });
});

describe('generateCustomerJwtSafely', () => {
  it('should generate a customer JWT when all data is present', async () => {
    ctx.user = { oid: 'user-oid' } as CustomExecutionContext["user"];

    fetchMock.get('https://api.stripe.com')
      .intercept({
        path: '/v1/customers/search?expand%5B%5D=data.subscriptions&query=metadata%5B%27oid%27%5D%3A%27user-oid%27'
      }).reply(200, {
        object: 'search_result',
        url: 'https://api.stripe.com/v1/customers/search',
        has_more: false,
        data: [
          {
            id: 'cus_123',
            object: 'customer',
            metadata: { oid: 'user-oid' },
            subscriptions: { data: [] },
          },
        ],
      })

    vi.mocked(signMessage).mockResolvedValue('signed-jwt');

    const result = await generateCustomerJwtSafely('access-token', env, ctx);

    expect(result).toBe('signed-jwt');
    expect(ctx.customer).toEqual({
      id: 'cus_123',
      object: 'customer',

      metadata: { oid: 'user-oid' },
      subscriptions: { data: [] },
    });
  });

  it('should return blank cookie if no oid and verification fails', async () => {
    vi.mocked(verify).mockResolvedValue({ isVerified: false, expired: false });

    const result = await generateCustomerJwtSafely('access-token', env, ctx);

    expect(result).toBe('customer=; Path=/; Max-Age=0; SameSite=Strict');

    expect(verify).toHaveBeenCalledWith('access-token', env, ctx);
  });

  it('should return blank cookie if no customer found', async () => {
    ctx.user = { oid: 'user-oid' } as CustomExecutionContext["user"];

    fetchMock.get('https://api.stripe.com')
      .intercept({
        path: '/v1/customers/search?expand%5B%5D=data.subscriptions&query=metadata%5B%27oid%27%5D%3A%27user-oid%27'
      }).reply(200, {
        object: 'search_result',
        url: 'https://api.stripe.com/v1/customers/search',
        has_more: false,
        data: [],
      })

    const result = await generateCustomerJwtSafely('access-token', env, ctx);

    expect(result).toBe('customer=; Path=/; Max-Age=0; SameSite=Strict');
  });

  it('should throw error if Stripe API call fails', async () => {
    ctx.user = { oid: 'user-oid' } as CustomExecutionContext["user"];

    fetchMock.get('https://api.stripe.com')
      .intercept({
        path: '/v1/customers/search?expand%5B%5D=data.subscriptions&query=metadata%5B%27oid%27%5D%3A%27user-oid%27'
      }).reply(500, 'Stripe error message')

    await expect(() => generateCustomerJwtSafely('access-token', env, ctx)).rejects.toThrow;
  });
});

describe('stripeFetchWrapper', () => {
  it('should make a fetch call with the correct headers and cache settings', async () => {
    fetchMock.get('https://api.stripe.com')
      .intercept({
        path: '/v1/customers'
      }).reply(200, 'Stripe Response')

    const response = await stripeFetchWrapper('https://api.stripe.com/v1/customers', env);

    expect(response).toBeInstanceOf(Response);
  });

  it('should throw an error if fetch fails', async () => {
    fetchMock.get('https://api.stripe.com')
      .intercept({
        path: '/v1/customers'
      }).reply(500, 'Network error')
    const rejectRespone = new Response('Internal Server Error', { status: 500 })
    vi.mocked(internalServerError).mockResolvedValue(rejectRespone);

    await expect(stripeFetchWrapper('https://api.stripe.com/v1/customers', env)).rejects.toThrow;
  });
});
