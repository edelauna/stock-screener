import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomExecutionContext } from "../../src/utils/middleware";
import { createExecutionContext, env, fetchMock, waitOnExecutionContext } from "cloudflare:test";
import { buildURL, fetchWrapper } from "../../src/utils/stocks";
import { internalServerError } from "../../src/utils/errors";

vi.mock('../../src/utils/errors');

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
  vi.clearAllMocks();
  vi.resetModules();
});

describe('buildURL', () => {
  it('should build a correct URL with the given body and API token', () => {
    const mockEnv = {
      ...env,
      STOCKS_BASE_URL: 'https://api.example.com',
      API_TOKEN: 'abc123',
    };

    const body = '/stocks?symbol=ABC';

    const url = buildURL(mockEnv, body);

    expect(url.toString()).toBe('https://api.example.com/stocks?symbol=ABC&apikey=abc123');
  });
});

describe('fetchWrapper', () => {
  it('should return a cached response if available', async () => {
    const mockCache = {
      match: vi.fn().mockResolvedValue(new Response('Cached response')),
      put: vi.fn(),
    };

    vi.stubGlobal('caches', {
      default: mockCache,
    });

    const mockUrl = new URL('https://api.example.com/stocks?symbol=ABC&apikey=abc123');

    const response = await fetchWrapper(mockUrl, ctx);

    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe('Cached response');
    expect(mockCache.match).toHaveBeenCalledWith(mockUrl.toString());
  });

  it('should fetch and cache a successful response', async () => {
    const mockCache = {
      match: vi.fn().mockResolvedValue(null),
      put: vi.fn(),
    };

    vi.stubGlobal('caches', {
      default: mockCache,
    });

    fetchMock.get('https://api.example.com')
      .intercept({
        path: '/stocks?symbol=ABC&apikey=abc123',
      }).reply(200, 'Fresh response')

    const mockUrl = new URL('https://api.example.com/stocks?symbol=ABC&apikey=abc123');

    const response = await fetchWrapper(mockUrl, ctx);

    expect(response).toBeInstanceOf(Response);

    expect(await response.text()).toBe('Fresh response');
    expect(response.headers.get('Cache-Control')).toBe('max-age=3600');

    expect(mockCache.match).toHaveBeenCalledWith(mockUrl.toString());
    expect(mockCache.put).toHaveBeenCalledWith(mockUrl.toString(), expect.any(Response));
  });

  it('should handle a non-successful response', async () => {
    const mockCache = {
      match: vi.fn().mockResolvedValue(null),
      put: vi.fn(),
    };

    vi.stubGlobal('caches', {
      default: mockCache,
    });

    fetchMock.get('https://api.example.com')
      .intercept({
        path: '/stocks?symbol=ABC&apikey=abc123'
      }).reply(500, 'Error response')

    vi.mocked(internalServerError).mockResolvedValue(new Response('Internal Server Error', { status: 500 }));

    const mockUrl = new URL('https://api.example.com/stocks?symbol=ABC&apikey=abc123');

    const response = await fetchWrapper(mockUrl, ctx);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Internal Server Error');

    expect(mockCache.match).toHaveBeenCalledWith(mockUrl.toString());

    expect(mockCache.put).not.toHaveBeenCalled();
    expect(internalServerError).toHaveBeenCalledWith('Stock API returned non success status', {
      response: expect.objectContaining({ status: 500 }),
      body: 'Error response',
    });
  });

  it('should use custom cacheTtl when provided', async () => {
    const mockCache = {
      match: vi.fn().mockResolvedValue(null),
      put: vi.fn(),
    };

    vi.stubGlobal('caches', {
      default: mockCache,
    });

    fetchMock.get('https://api.example.com')
      .intercept({
        path: '/stocks?symbol=ABC&apikey=abc123'
      }).reply(200, 'Fresh response')

    const mockUrl = new URL('https://api.example.com/stocks?symbol=ABC&apikey=abc123');

    const response = await fetchWrapper(mockUrl, ctx, 7200);

    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe('Fresh response');
    expect(response.headers.get('Cache-Control')).toBe('max-age=7200');

    expect(mockCache.match).toHaveBeenCalledWith(mockUrl.toString());
    expect(mockCache.put).toHaveBeenCalledWith(mockUrl.toString(), expect.any(Response));
  });
});
