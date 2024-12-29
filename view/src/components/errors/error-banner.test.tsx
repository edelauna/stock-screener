import React from "react";
import { Actions, ActionType, ToggleShow } from "../../context/errors/errors.actions";
import { errorStore, initialState, State } from "../../context/errors/errors.provider";
import { fireEvent, render, screen } from "@testing-library/react";
import ErrorBanner from "./error-banner";

jest.mock('./error-dialog', () => () => <div>Error dialog mocked</div>);

const setup = (initialState: State) => {
  const mockDispatch = jest.fn()
  const TestWrapper = ({ children }: {children: React.ReactNode}) => {
    const [state] = React.useReducer(
      (state: State, action: Actions) => {
        switch (action.type) {
          case ActionType.ToggleShow:
            return { ...state, showErrors: action.payload };
          default:
            return state;
        }
      },
      initialState
    );

    return (
      <errorStore.Provider value={{ state, dispatch: mockDispatch }}>
        {children}
      </errorStore.Provider>
    );
  };

  return {
    ...render(<TestWrapper><ErrorBanner /></TestWrapper>),
    mockDispatch
  };
};

describe('ErrorBanner', () => {
  it('should not display the banner when there are no errors', () => {
    setup(initialState);

    expect(screen.queryByText(/There were some recent errors/i)).not.toBeInTheDocument();
  });

  it('should display the banner when there are errors', () => {
    setup({ ...initialState, errors: [{
      id: '1',
      header: 'Error 1',
      body: 'body'
    }, {
      id: '2',
      header: 'Error 2',
      body: 'body'
    }] });

    expect(screen.getByText(/There were some recent errors/i)).toBeInTheDocument();
  });

  it('should dismiss the banner when the dismiss button is clicked', () => {
    setup({ ...initialState, errors: [{
      id: '1',
      header: 'Error 1',
      body: 'body'
    }] });

    expect(screen.getByText(/There were some recent errors/i)).toBeInTheDocument();

    const dismissButton = screen.getByRole('button', { name: /Dismiss/i });
    fireEvent.click(dismissButton);

    expect(screen.queryByText(/There were some recent errors/i)).not.toBeInTheDocument();
  });

  it('should call dispatch when "See Errors" button is clicked', () => {
    const state = { ...initialState, errors: [{
      id: '1',
      header: 'Error 1',
      body: 'body'
    }] };

    // Setup initial state with dispatch
    const {mockDispatch } = setup(state);

    const seeErrorsButton = screen.getByRole('button', { name: /See Errors/i });

    fireEvent.click(seeErrorsButton);

    // Assert: Check if the dispatch was called with the right action
    expect(mockDispatch).toHaveBeenCalledWith(ToggleShow(true)); // check how ToggleShow is constructed
  });
});
