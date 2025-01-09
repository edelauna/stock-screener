import { useContext } from "react";
import { initialState, store } from "../context/symbol-search/symbol-search.provider";
import { errorStore } from "../context/errors/errors.provider";
import { useDb } from "./use-db";
import { renderHook } from "@testing-library/react";
import { useSymbolSearch } from "./use-symbol-search";

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

jest.mock('./use-db', () => ({
  useDb: jest.fn(),
}));

// Mock the fetch function
global.fetch = jest.fn();

describe('useSymbolSearch hook', () => {
  const mockSymbolSearchDispatch = jest.fn();
  const mockErrorDispatch = jest.fn();
  const mockDb = {
    transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useContext as jest.Mock).mockImplementation((context) => {
      if (context === store) {
        return { state: { ...initialState, bestMatches: [] }, dispatch: mockSymbolSearchDispatch };
      } else if (context === errorStore) {
        return { dispatch: mockErrorDispatch };
      }
    });
    (useDb as jest.Mock).mockReturnValue({
      db: mockDb,
      active: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });
  it('should initialize with correct state', () => {
    const { result } = renderHook(() => useSymbolSearch(''));

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});