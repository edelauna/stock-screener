import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorDialog, ErrorProvider, errorStore, generateIssueLink, initialState } from './errors.provider';
import { ActionType } from './errors.actions';
import userEvent from '@testing-library/user-event';

describe('ErrorProvider', () => {

  it('provides the initial state', () => {
    const TestComponent = () => {
      const { state } = React.useContext(errorStore);
      return <div data-testid="state">{JSON.stringify(state)}</div>;
    };

    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    const stateElement = screen.getByTestId('state');
    expect(stateElement.textContent).toEqual(JSON.stringify(initialState));
  });

  it('updates the state when dispatching actions', async () => {
    const TestComponent = () => {
      const { state, dispatch } = React.useContext(errorStore);
      return (
        <>
          <div data-testid="state">{JSON.stringify(state)}</div>
          <button onClick={() => dispatch({ type: ActionType.Add, payload: { id: '1', header: 'Error 1', body: 'Error 1 description' } })}>Add Error</button>

          <button onClick={() => dispatch({ type: ActionType.Remove, payload: '1' })}>Remove Error</button>
          <button onClick={() => dispatch({ type: ActionType.RemoveAll })}>Remove All Errors</button>
          <button onClick={() => dispatch({ type: ActionType.ToggleShow, payload: true })}>Toggle Show</button>
          <button onClick={() => dispatch({ type: ActionType.CtaResolvable, payload: true })}>Toggle CTA</button>
        </>
      );
    };

    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );

    const stateElement = screen.getByTestId('state')

    // Initial state
    expect(screen.getByTestId('state').textContent).toEqual(JSON.stringify(initialState));

    // Add Error
    userEvent.click(screen.getByText('Add Error'));
    expect(screen.getByTestId('state').textContent).toEqual(JSON.stringify({
      ...initialState,
      errors: [{ id: '1', header: 'Error 1', body: 'Error 1 description' }],
    }))

    // Remove Error
    userEvent.click(screen.getByText('Remove Error'));
    expect(stateElement.textContent).toEqual(JSON.stringify(initialState));

    // // Add Error again
    userEvent.click(screen.getByText('Add Error'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...initialState,
      errors: [{ id: '1', header: 'Error 1', body: 'Error 1 description' }],
    }));

    // // Remove All Errors
    userEvent.click(screen.getByText('Remove All Errors'));
    expect(stateElement.textContent).toEqual(JSON.stringify(initialState));

    // // Toggle Show
    userEvent.click(screen.getByText('Toggle Show'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...initialState,
      show: true,
    }));

    // // Toggle CTA
    userEvent.click(screen.getByText('Toggle CTA'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...initialState,
      show: true,
      showCTA: true,
    }));
  });
});

describe('generateIssueLink', () => {
  it('generates a correct GitHub issue link', () => {
    const error: ErrorDialog = { id: '1', header: 'Error 1', body: 'Error 1 description' };
    const link = generateIssueLink(error);
    expect(link).toBe('https://github.com/edelauna/stock-screener/issues/new?title=Error%201&body=Error%201%20description&labels=bug');
  });
});
