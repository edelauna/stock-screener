import React from "react";
import { useDb } from "../../hooks/use-db";
import { errorStore, initialState } from "../errors/errors.provider";
import { store, SymbolSearchProvider, initialState as symbolInitialState } from "./symbol-search.provider";
import { ActionType } from "./symbol-search.actions";
import { createSymbolSearchResult } from "../../test-utils/symbol-search-result-factory.test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Add } from "../errors/errors.actions";

jest.mock('../../hooks/use-db', () => ({
  useDb: jest.fn(),
}));

const mockUseDb = useDb as jest.MockedFunction<typeof useDb>;

const mockErrorDispatch = jest.fn();

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <errorStore.Provider value={{ state: initialState, dispatch: mockErrorDispatch }}>
    {children}
  </errorStore.Provider>
);

describe('SymbolSearchProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDb.mockReturnValue({ db: null, active: false });
  });

  const refreshPayload = createSymbolSearchResult()
  const updateDatePayload = createSymbolSearchResult({"1. symbol": 'MSFT'})
  const TestComponent = () => {
    const { state, dispatch } = React.useContext(store);
    return (
      <>
        <div data-testid="state">{JSON.stringify(state)}</div>
        <button onClick={() => dispatch({ type: ActionType.Refresh, payload: [refreshPayload] })}>Refresh</button>
        <button onClick={() => dispatch({ type: ActionType.UpdateBusyStatus, payload: true })}>Set Busy</button>
        <button onClick={() => dispatch({ type: ActionType.UpdateActiveSymbol, payload: updateDatePayload })}>Set Active Symbol</button>
        <button onClick={() => dispatch({ type: ActionType.UpdateCurrentDataRef, payload: 'newDataRef' })}>Set Current Data Ref</button>
        <button onClick={() => dispatch({ type: ActionType.UpdateCurrentInputRef, payload: 'newInputRef' })}>Set Current Input Ref</button>
      </>
    );
  };

  it('provides the initial state', () => {
    render(
      <TestWrapper>
        <SymbolSearchProvider>
          <TestComponent />
        </SymbolSearchProvider>
      </TestWrapper>
    );

    const stateElement = screen.getByTestId('state');

    expect(stateElement.textContent).toEqual(JSON.stringify(symbolInitialState));
  });

  it('updates the state when dispatching actions', async () => {
    render(
      <TestWrapper>
        <SymbolSearchProvider>
          <TestComponent />
        </SymbolSearchProvider>
      </TestWrapper>
    );

    const stateElement = screen.getByTestId('state');

    // Initial state

    expect(stateElement.textContent).toEqual(JSON.stringify(symbolInitialState));

    // Refresh
    userEvent.click(screen.getByText('Refresh'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...symbolInitialState,
      bestMatches: [refreshPayload],
    }));

    // Set Busy
    userEvent.click(screen.getByText('Set Busy'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...symbolInitialState,
      bestMatches: [refreshPayload],
      busy: true,
    }));

    // Set Active Symbol

    userEvent.click(screen.getByText('Set Active Symbol'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...symbolInitialState,
      bestMatches: [refreshPayload],
      busy: true,
      activeSymbol: updateDatePayload,
    }));

    // Set Current Data Ref
    userEvent.click(screen.getByText('Set Current Data Ref'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...symbolInitialState,
      bestMatches: [refreshPayload],
      busy: true,
      activeSymbol: updateDatePayload,
      currentDataRef: 'newDataRef',
    }));

    // Set Current Input Ref
    userEvent.click(screen.getByText('Set Current Input Ref'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...symbolInitialState,
      bestMatches: [refreshPayload],
      busy: true,
      activeSymbol: updateDatePayload,
      currentDataRef: 'newDataRef',
      currentInputRef: 'newInputRef',
    }));
  });

  it('saves state to IndexedDB when conditions are met', async () => {
    const mockDb = {
      transaction: jest.fn().mockReturnThis(),
      objectStore: jest.fn().mockReturnThis(),
      put: jest.fn(),
    };
    mockUseDb.mockReturnValue({ db: mockDb as unknown as IDBDatabase, active: false });

    render(
      <TestWrapper>
        <SymbolSearchProvider>
          <TestComponent />
        </SymbolSearchProvider>
      </TestWrapper>
    );

    const stateElement = screen.getByTestId('state');

    // Initial state
    expect(stateElement.textContent).toEqual(JSON.stringify(symbolInitialState));

    // Refresh with bestMatches
    userEvent.click(screen.getByText('Refresh'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...symbolInitialState,
      bestMatches: [refreshPayload],
    }));

    // Set Current Data Ref

    userEvent.click(screen.getByText('Set Current Data Ref'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...symbolInitialState,
      bestMatches: [refreshPayload],
      currentDataRef: 'newDataRef',
    }));

    await waitFor(() => {
      expect(mockDb.transaction).toHaveBeenCalledWith(['symbol-search'], 'readwrite');
    });
    expect(mockDb.objectStore).toHaveBeenCalledWith('symbol-search');
    expect(mockDb.put).toHaveBeenCalledWith({ bestMatches: [refreshPayload], input: 'newDataRef' });
  });
});
