import { useContext } from "react";
import { errorStore } from "../context/errors/errors.provider";
import {initialState, store} from '../context/market-status/market-status.provider'
import { renderHook, waitFor } from "@testing-library/react";
import { useMarketStatus } from "./use-market-status";
import { mswServer } from "../setupTests";
import { rest } from "msw";
import { Refresh } from "../context/market-status/market-status.actions";
import { createGlobalMarketData } from "../test-utils/global-market-data-factory.test";
import { Add } from "../context/errors/errors.actions";

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

// Mock the fetch function
global.fetch = jest.fn();

describe('useMarketStatus hook', () => {
  const mockMarketStatusDispatch = jest.fn();
  const mockErrorDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useContext as jest.Mock).mockImplementation((context) => {
          if (context === store) {
            return { state: {...initialState, initializing: false}, dispatch: mockMarketStatusDispatch };
          } else if (context === errorStore) {
            return { dispatch: mockErrorDispatch };
          }
        });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with correct state', async () => {
    const { result } = renderHook(() => useMarketStatus());

    expect(result.current.data).toEqual([]);
  });

  it('should fetch data when conditions are met', async () => {
    const mockData = { endpoint: 'Global Market Open & Close Status', markets: [createGlobalMarketData()] };
    mswServer.use(
      rest.get(`${process.env.REACT_APP_API_URL}stocks`,
        (_, res, ctx) => res(ctx.json(mockData))
      )
    )

   renderHook(() => useMarketStatus());

    await waitFor(() => expect(mockMarketStatusDispatch).toHaveBeenCalledWith(Refresh({ markets: [createGlobalMarketData()], currentRef: expect.stringMatching("") })))
  });

  it('should handle fetch error', async () => {
    mswServer.use(
      rest.get(`${process.env.REACT_APP_API_URL}stocks`,
        (_, res, ctx) => res.networkError('Error message')
    ))

    renderHook(() => useMarketStatus());

    await waitFor(() => expect(mockErrorDispatch).toHaveBeenCalledWith(
      Add({
        header: 'Error in useMarketStatus hook',
        body: 'Failed to fetch',
        id: expect.anything()
      })
    ))
  });
});
