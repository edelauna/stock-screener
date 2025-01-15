import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomExecutionContext } from "../../../src/utils/middleware";
import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { buildURL, fetchWrapper } from "../../../src/utils/stocks";
import { marketStatus } from "../../../src/handlers/stocks/market-status";

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

describe('marketStatus', () => {
  const mockMarketStatusProperties = {
    fn: 'MARKET_STATUS',
    workerArgs: {
      request: new Request('http://test'),
      ctx,
      env
    },
  };

  it('should return the response when the data contains the expected metadata information', async () => {
    // Mock the fetchWrapper function
    vi.mocked(fetchWrapper).mockResolvedValue(new Response('{"Meta Data":{"Information":"Global Market Open & Close Status"},"data":"some-data"}'));

    // Call the marketStatus function
    const response = await marketStatus(mockMarketStatusProperties);

    // Check if the response is an instance of Response
    expect(response).toBeInstanceOf(Response);

    // Check the status code
    expect(response.status).toBe(200);

    // Check the JSON body
    const jsonBody = await response.json();
    expect(jsonBody).toEqual({ "Meta Data": { "Information": "Global Market Open & Close Status" }, data: "some-data" });

  });

  it('should return an internal server error when the data does not contain the expected metadata information', async () => {
    // Mock the fetchWrapper function
    vi.mocked(fetchWrapper).mockResolvedValue(new Response('{"unexpected":"data"}'));

    // Call the marketStatus function
    const response = await marketStatus(mockMarketStatusProperties);

    // Check if the response is an instance of Response
    expect(response).toBeInstanceOf(Response);

    // Check the status code
    expect(response.status).toBe(500);

    // Check the JSON body
    const jsonBody = await response.json();
    expect(jsonBody).toEqual(expect.objectContaining({
      message: expect.stringContaining("Server Error")
    }));
  });

  it('should return an internal server error when fetchWrapper throws an error', async () => {
    // Mock the fetchWrapper function

    vi.mocked(fetchWrapper).mockRejectedValue(new Error('Network error'));

    // Call the marketStatus function
    const response = await marketStatus(mockMarketStatusProperties);

    // Check if the response is an instance of Response
    expect(response).toBeInstanceOf(Response);

    // Check the status code
    expect(response.status).toBe(500);

    // Check the JSON body
    const jsonBody = await response.json();
    expect(jsonBody).toEqual(expect.objectContaining({
      message: expect.stringContaining("Server Error")
    }));
  });
});
