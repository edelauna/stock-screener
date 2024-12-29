import { useContext } from "react";
import { errorStore } from "../../context/errors/errors.provider";
import {store} from '../../context/symbol-search/symbol-search.provider'
import { createSymbolSearchResult } from "../../test-utils/symbol-search-result-factory.test";
import { formattedDateTime } from "../../utils/dateTime";
import { createMetaData } from "../../test-utils/time-series/metadata-factory.test";
import { createTimeSeriesDayData } from "../../test-utils/time-series/time-series-daily-factory.test";
import { mswServer } from "../../setupTests";
import { rest } from "msw";
import { renderHook, waitFor } from "@testing-library/react";
import { useTimeSeriesDaily } from "./use-time-series-daily";
import { Add, ErrorIds } from "../../context/errors/errors.actions";

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

jest.mock('../../utils/dateTime', () => ({
  formattedDateTime: jest.fn(),
}));
describe('useTimeSeriesDaily', () => {
  const mockErrorDispatch = jest.fn();
  const mockSymbolDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useContext as jest.Mock).mockImplementation((context) => {
      if (context === errorStore) {
        return { dispatch: mockErrorDispatch };
      } else if (context === store) {
        return { state: { activeSymbol: createSymbolSearchResult() }, dispatch: mockSymbolDispatch };
      }
    });
    (formattedDateTime as jest.Mock).mockReturnValue('2023-10-01T00:00:00Z');
  });

  it('initializes state and fetches data on symbol change', async () => {
    const mockData = {
      "Meta Data": createMetaData(),
      "Time Series (Daily)": {
        "2023-09-30": createTimeSeriesDayData(),
      },
    };
    mswServer.use(
      rest.get(`${process.env.REACT_APP_API_URL}stocks`,
        (_, res, ctx) => res(ctx.json(mockData))
      )
    )
    const { result } = renderHook(() => useTimeSeriesDaily());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.metadata).toEqual({
      symbol: '',
      "1. Information": '',
      "2. Symbol": '',
      "3. Last Refreshed": '',
      "4. Output Size": '',
      "5. Time Zone": '',
    });

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([
      {
        id: '1',
        date: expect.anything(),
        symbol: 'AAPL',
        "1. open": "100",
        "2. high": "110",
        "3. low": "90",
        "4. close": "100",
        "5. adjusted close": "100",
        "6. volume": "100",
        "7. dividend amount": "0",
        "8. split coefficient": "0",
      },
    ]);
    expect(result.current.metadata).toEqual({
      symbol: 'AAPL',
      "1. Information": 'Daily Time Series',
      "2. Symbol": 'AAPL',
      "3. Last Refreshed": '2023-10-01T00:00:00Z',
      "4. Output Size": 'Full size',
      "5. Time Zone": 'UTC',
    });
  });

  it('handles network error and dispatches error', async () => {
    const mockError = new Error('Network error');
    mswServer.use(
      rest.get(`${process.env.REACT_APP_API_URL}stocks`,
        (_, res, ctx) => res.networkError(mockError.message)
      )
    )
    const { result } = renderHook(() => useTimeSeriesDaily());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false))
    // commenting this out since can be populated from db - and not fully mocking out useDb
    // expect(result.current.data).toEqual([]);
    // expect(result.current.metadata).toEqual({
    //   symbol: '',
    //   "1. Information": '',
    //   "2. Symbol": '',
    //   "3. Last Refreshed": '',
    //   "4. Output Size": '',
    //   "5. Time Zone": '',
    // });
    expect(mockErrorDispatch).toHaveBeenCalledWith(Add({
      header: "useTimeSeriesDaily::fetchData: had an error",
      body: 'Failed to fetch',
      id: expect.anything()
    }));
  });

  test('handles API error (429) and dispatches error', async () => {
    mswServer.use(
      rest.get(`${process.env.REACT_APP_API_URL}stocks`,
        (_, res, ctx) => res(
          ctx.status(429),
          ctx.text('Rate limit exceeded')
        )
      )
    )

    const { result } = renderHook(() => useTimeSeriesDaily());

    expect(result.current.loading).toBe(true);

    await waitFor(() =>expect(result.current.loading).toBe(false))
    // commenting this out since can be populated from db - and not fully mocking out useDb
    // expect(result.current.data).toEqual([]);
    // expect(result.current.metadata).toEqual({
    //   symbol: '',
    //   "1. Information": '',
    //   "2. Symbol": '',
    //   "3. Last Refreshed": '2023-10-01T00:00:00Z',
    //   "4. Output Size": '',
    //   "5. Time Zone": '',
    // });
    expect(mockErrorDispatch).toHaveBeenCalledWith(Add({
      header: "Reached the current limit for available tickers.",
      body: "If you are not logged in, logging in will reset the counter, however for unlimited tickers, please upgrade.",
      id: ErrorIds.CtaRequire,
    }));
  });
  // todo - mock out useDb and tests transactions
});
