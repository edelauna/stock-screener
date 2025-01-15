import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomExecutionContext } from "../../../src/utils/middleware";
import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { buildURL, fetchWrapper } from "../../../src/utils/stocks";
import { searchSymbolHandler } from "../../../src/handlers/stocks/symbol-search";

vi.mock('../../../src/utils/stocks');

let ctx: CustomExecutionContext;

beforeEach(() => {
  ctx = createExecutionContext();
  vi.mocked(buildURL).mockReturnValue(new URL('http://mock-url'));
});

afterEach(() => {
  waitOnExecutionContext(ctx);
});

afterAll(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('searchSymbolHandler', () => {
  const mockSearchSymbolHandlerProperties = {
    fn: 'SEARCH_SYMBOL',
    keywords: 'apple',
    workerArgs: {
      request: new Request('http://test'),
      ctx,
      env
    },
  };

  it('should return the response when the data contains bestMatches', async () => {
    // Mock the fetchWrapper function
    vi.mocked(fetchWrapper).mockResolvedValue(new Response(JSON.stringify({
      bestMatches: [{ symbol: 'AAPL', name: 'Apple Inc.' }]
    })));

    // Call the searchSymbolHandler function
    const response = await searchSymbolHandler(mockSearchSymbolHandlerProperties);

    // Check if the response is an instance of Response
    expect(response).toBeInstanceOf(Response);

    // Check the status code
    expect(response.status).toBe(200);

    // Check the JSON body
    const jsonBody = await response.json();
    expect(jsonBody).toEqual({
      bestMatches: [{ symbol: 'AAPL', name: 'Apple Inc.' }]
    });
  });

  it('should return an internal server error when the data does not contain bestMatches', async () => {
    // Mock the fetchWrapper function
    vi.mocked(fetchWrapper).mockResolvedValue(new Response(JSON.stringify({
      unexpected: 'data'
    })));

    // Call the searchSymbolHandler function
    const response = await searchSymbolHandler(mockSearchSymbolHandlerProperties);

    // Check if the response is an instance of Response

    expect(response).toBeInstanceOf(Response);

    // Check the status code
    expect(response.status).toBe(500);

    // Check the JSON body
    const jsonBody = await response.json();
    expect(jsonBody).toEqual(expect.objectContaining({
      message: expect.stringContaining('Server Error')
    }));
  });

  it('should return an internal server error when fetchWrapper throws an error', async () => {
    // Mock the fetchWrapper function

    vi.mocked(fetchWrapper).mockRejectedValue(new Error('Network error'));

    // Call the searchSymbolHandler function
    const response = await searchSymbolHandler(mockSearchSymbolHandlerProperties);

    // Check if the response is an instance of Response
    expect(response).toBeInstanceOf(Response);

    // Check the status code
    expect(response.status).toBe(500);

    // Check the JSON body
    const jsonBody = await response.json();

    expect(jsonBody).toEqual(expect.objectContaining({
      message: expect.stringContaining('Server Error')
    }));
  });

  it('should handle null keywords', async () => {
    // Mock the searchSymbolHandlerProperties with null keywords
    const mockSearchSymbolHandlerPropertiesWithNullKeywords = {
      ...mockSearchSymbolHandlerProperties,
      keywords: null,
    };

    // Mock the buildURL function to verify it's called with null keywords
    vi.mocked(buildURL).mockImplementation((env, path) => {
      expect(path).toBe('SEARCH_SYMBOL&keywords=null');
      return new URL('http://mock-url');
    });

    // Mock the fetchWrapper function
    vi.mocked(fetchWrapper).mockResolvedValue(new Response(JSON.stringify({
      bestMatches: [{ symbol: 'AAPL', name: 'Apple Inc.' }]
    })));

    // Call the searchSymbolHandler function
    const response = await searchSymbolHandler(mockSearchSymbolHandlerPropertiesWithNullKeywords);

    // Check if the response is an instance of Response
    expect(response).toBeInstanceOf(Response);

    // Check the status code
    expect(response.status).toBe(200);

    // Check the JSON body
    const jsonBody = await response.json();
    expect(jsonBody).toEqual({
      bestMatches: [{ symbol: 'AAPL', name: 'Apple Inc.' }]
    });
  });
});
