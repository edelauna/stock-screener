import { useContext } from "react";
import { errorStore } from "../context/errors/errors.provider";
import {initialState, store} from '../context/market-status/market-status.provider'
import { renderHook } from "@testing-library/react";
import { useMarketStatus } from "./use-market-status";

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
            return { state: initialState, dispatch: mockMarketStatusDispatch };
          } else if (context === errorStore) {
            return { dispatch: mockErrorDispatch };
          }
        });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with correct state', () => {
    const { result } = renderHook(() => useMarketStatus());

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  // it('should update data when state changes', () => {
  //   const { result, rerender } = renderHook(() => useMarketStatus());

  //   act(() => {
  //     store.useContext().state.markets = [{ name: 'Market1', status: 'Open' }];
  //   });

  //   rerender();

  //   expect(result.current.data).toEqual([{ name: 'Market1', status: 'Open' }]);
  // });

  // it('should fetch data when conditions are met', async () => {
  //   const mockData = { endpoint: 'Global Market Open & Close Status', markets: [{ name: 'Market1', status: 'Open' }] };
  //   global.fetch.mockResolvedValueOnce({
  //     ok: true,
  //     json: () => Promise.resolve(mockData),
  //   });

  //   const { result, waitForNextUpdate } = renderHook(() => useMarketStatus());

  //   act(() => {

  //     store.useContext().state.initializing = false;
  //     store.useContext().state.currentRef = 'oldDate';
  //   });

  //   act(() => {
  //     result.current.loading = false;
  //     result.current.input = 'newDate';
  //   });

  //   await waitForNextUpdate();

  //   expect(global.fetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}stocks?fn=MARKET_STATUS`);
  //   expect(result.current.loading).toBe(true);

  //   await waitForNextUpdate();

  //   expect(result.current.loading).toBe(false);
  //   expect(result.current.data).toEqual([{ name: 'Market1', status: 'Open' }]);
  //   expect(store.useContext().dispatch).toHaveBeenCalledWith(Refresh({ markets: [{ name: 'Market1', status: 'Open' }], currentRef: 'newDate' }));
  // });

  // it('should handle fetch error', async () => {
  //   global.fetch.mockResolvedValueOnce({
  //     ok: false,
  //     text: () => Promise.resolve('Error message'),
  //   });

  //   const { result, waitForNextUpdate } = renderHook(() => useMarketStatus());

  //   act(() => {
  //     store.useContext().state.initializing = false;
  //     store.useContext().state.currentRef = 'oldDate';
  //   });

  //   act(() => {
  //     result.current.loading = false;
  //     result.current.input = 'newDate';
  //   });

  //   await waitForNextUpdate();

  //   expect(global.fetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}stocks?fn=MARKET_STATUS`);

  //   expect(result.current.loading).toBe(true);

  //   await waitForNextUpdate();

  //   expect(result.current.loading).toBe(false);
  //   expect(errorStore.useContext().dispatch).toHaveBeenCalledWith(
  //     Add({
  //       header: 'Network response was not ok',
  //       body: 'Error message',
  //     })
  //   );
  // });

  // it('should update input every 15 minutes', () => {
  //   const { result } = renderHook(() => useMarketStatus());

  //   expect(result.current.input).toBe(new Date().toUTCString());

  //   act(() => {
  //     jest.advanceTimersByTime(15 * 60 * 1000);
  //   });

  //   const newDate = new Date(result.current.input);
  //   newDate.setMinutes(newDate.getMinutes() + 15);

  //   expect(result.current.input).toBe(newDate.toUTCString());
  // });
});
