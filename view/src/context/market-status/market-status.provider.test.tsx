import React from "react";
import { initialState, MarketStatusProvider, State, store } from "./market-status.provider";
import { render, screen } from "@testing-library/react";
import { createGlobalMarketData } from "../../test-utils/global-market-data-factory.test";
import { ActionType } from "./market-status.actions";
import userEvent from "@testing-library/user-event";

describe('MarketStatusProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const expectedState = {...initialState, initializing: false}
  it('provides the initial state', () => {
    const TestComponent = () => {
      const { state } = React.useContext(store);
      return <div data-testid="state">{JSON.stringify(state)}</div>;
    };

    render(
      <MarketStatusProvider>
        <TestComponent />
      </MarketStatusProvider>
    );

    // eslint-disable-next-line no-restricted-globals
    const stateElement = screen.getByTestId('state');

    expect(stateElement.textContent).toEqual(JSON.stringify(expectedState));
  });

  it('loads state from localStorage if available', () => {
    const mockState: State = {
      currentRef: 'testRef',
      initializing: false,
      markets: [
        createGlobalMarketData()
      ],
    };

    localStorage.setItem('market-status', JSON.stringify(mockState));

    const TestComponent = () => {
      const { state } = React.useContext(store);
      return <div data-testid="state">{JSON.stringify(state)}</div>;
    };

    render(
      <MarketStatusProvider>
        <TestComponent />
      </MarketStatusProvider>
    );

    const stateElement = screen.getByTestId('state');

    expect(stateElement.textContent).toEqual(JSON.stringify(mockState));
  });

  it('updates the state when dispatching actions', async () => {
    const TestComponent = () => {
      const { state, dispatch } = React.useContext(store);
      return (
        <>
          <div data-testid="state">{JSON.stringify(state)}</div>
          <button onClick={() => dispatch({ type: ActionType.Refresh, payload: { currentRef: 'newRef', markets: [] } })}>Refresh</button>
        </>
      );
    };

    render(
      <MarketStatusProvider>
        <TestComponent />
      </MarketStatusProvider>
    );

    const stateElement = screen.getByTestId('state');

    // Initial state
    expect(stateElement.textContent).toEqual(JSON.stringify(expectedState));

    // Refresh
    userEvent.click(screen.getByText('Refresh'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...expectedState,
      currentRef: 'newRef',
      markets: [],
    }));

    // Check if localStorage is updated
    expect(localStorage.getItem('market-status')).toEqual(JSON.stringify({
      currentRef: 'newRef',
      initializing: false,
      markets: [],
    }));
  });

  it('loads initial state from localStorage on first render', async () => {
    const mockState: State = {
      currentRef: 'testRef',
      initializing: false,
      markets: [
        createGlobalMarketData()
      ],
    };

    localStorage.setItem('market-status', JSON.stringify(mockState));

    const TestComponent = () => {
      const { state } = React.useContext(store);
      return <div data-testid="state">{JSON.stringify(state)}</div>;
    };

    render(
      <MarketStatusProvider>
        <TestComponent />
      </MarketStatusProvider>
    );

    const stateElement = screen.getByTestId('state');

    // Initial state should be the one from localStorage
    expect(stateElement.textContent).toEqual(JSON.stringify(mockState));

    expect(stateElement.textContent).toEqual(JSON.stringify(mockState));

    // Check if localStorage is updated
    expect(localStorage.getItem('market-status')).toEqual(JSON.stringify(mockState));
  });
});
