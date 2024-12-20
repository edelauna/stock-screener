import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomExecutionContext } from "../../../src/utils/middleware";
import { buildURL, fetchWrapper } from "../../../src/utils/stocks";
import { getCurrentDate } from "../../../src/utils/date";
import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { timeSeriesDaily } from "../../../src/handlers/stocks/time-series-daily";
import { planGuard } from "../../../src/utils/billing";

vi.mock('../../../src/utils/stocks');
vi.mock('../../../src/utils/billing');

let ctx: CustomExecutionContext;

afterAll(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('timeSeriesDaily', () => {

  const mockEnv = {
    ...env,
    BASE_PLAN: 'free',
    LOKEEL_STOCK_SCREENER_KV: {
      get: vi.fn(),
      put: vi.fn(),
      list: vi.fn(),
      getWithMetadata: vi.fn(),
      delete: vi.fn(),
    }

    // Add other environment variables if needed
  };

  const mockTimeSeriesDailyProperties = {
    fn: 'TIME_SERIES_DAILY',
    symbol: 'AAPL',
    outputsize: 'full',
    workerArgs: {
      request: new Request('http://test'),
      ctx,
      env: mockEnv
    },
  };

  beforeEach(() => {
    ctx = createExecutionContext();
    mockTimeSeriesDailyProperties.workerArgs.ctx = ctx
    vi.mocked(buildURL).mockReturnValue(new URL('http://mock-url'));
  });


  afterEach(() => {
    waitOnExecutionContext(ctx);
  });

  it('should return the response when the data contains the expected metadata information', async () => {
    // Mock the fetchWrapper function

    vi.mocked(fetchWrapper).mockResolvedValue(new Response('{"Meta Data":{"Information":"Daily Time Series with Splits and Dividend Events"},"data":"some-data"}'));

    // Call the timeSeriesDaily function
    const response = await timeSeriesDaily(mockTimeSeriesDailyProperties);

    // Check if the response is an instance of Response
    expect(response).toBeInstanceOf(Response);

    // Check the status code
    expect(response.status).toBe(200);

    // Check the JSON body
    const jsonBody = await response.json();
    expect(jsonBody).toEqual({
      "Meta Data": { "Information": "Daily Time Series with Splits and Dividend Events" },
      data: "some-data"
    });
  });

  it('should return an internal server error when the data does not contain the expected metadata information', async () => {
    // Mock the fetchWrapper function
    vi.mocked(fetchWrapper).mockResolvedValue(new Response('{"unexpected":"data"}'));

    // Call the timeSeriesDaily function
    const response = await timeSeriesDaily(mockTimeSeriesDailyProperties);
    console.log('response', response)
    // Check if the response is an instance of Response
    expect(response).toBeInstanceOf(Response);

    // Check the status code

    expect(response.status).toBe(500);

    // Check the JSON body
    const jsonBody = await response.json();
    expect(jsonBody).toEqual(expect.objectContaining({
      message: 'Server Error'
    }));
  });

  it('should return an internal server error when fetchWrapper throws an error', async () => {
    // Mock the fetchWrapper function
    vi.mocked(fetchWrapper).mockRejectedValue(new Error('Network error'));

    // Call the timeSeriesDaily function
    const response = await timeSeriesDaily(mockTimeSeriesDailyProperties);

    // Check if the response is an instance of Response
    expect(response).toBeInstanceOf(Response);

    // Check the status code
    expect(response.status).toBe(500);

    // Check the JSON body
    const jsonBody = await response.json();

    expect(jsonBody).toEqual(expect.objectContaining({
      message: 'Server Error'
    }));
  });

  it('should return a rate limit response when the guard function returns true', async () => {
    // Mock the planGuard function
    vi.mocked(planGuard).mockResolvedValue(false);

    // Mock the LOKEEL_STOCK_SCREENER_KV.get function
    vi.mocked(mockEnv.LOKEEL_STOCK_SCREENER_KV.get).mockResolvedValue(`{"${getCurrentDate()}":["SPY","GOOGL","MSFT"]}`);

    // Call the timeSeriesDaily function
    const response = await timeSeriesDaily(mockTimeSeriesDailyProperties);

    // Check if the response is an instance of Response
    expect(response).toBeInstanceOf(Response);

    // Check the status code
    expect(response.status).toBe(429);

    // Check the text body
    const textBody = await response.text();
    expect(textBody).toBe('Rate limited, login, or upgrade account.');
  });

  it('should return false from guard function when user is on a paid plan', async () => {
    vi.mocked(fetchWrapper).mockResolvedValue(new Response('{"Meta Data":{"Information":"Daily Time Series with Splits and Dividend Events"},"data":"some-data"}'));

    // Mock the planGuard function
    vi.mocked(planGuard).mockResolvedValue(true);

    // Mock the ctx.user.oid
    ctx.user = { oid: 'user123' } as CustomExecutionContext["user"];

    // Mock the LOKEEL_STOCK_SCREENER_KV.get function
    vi.mocked(mockEnv.LOKEEL_STOCK_SCREENER_KV.get).mockResolvedValue(`{"${getCurrentDate()}":["AAPL","GOOGL","MSFT"]}`);

    // Call the timeSeriesDaily function
    const response = await timeSeriesDaily(mockTimeSeriesDailyProperties);

    // Check if the response is an instance of Response
    expect(response).toBeInstanceOf(Response);

    // Check the status code
    expect(response.status).toBe(200);

    const jsonBody = await response.json();
    expect(jsonBody).toEqual({
      "Meta Data": { "Information": "Daily Time Series with Splits and Dividend Events" },
      data: "some-data"
    });
  });
});
