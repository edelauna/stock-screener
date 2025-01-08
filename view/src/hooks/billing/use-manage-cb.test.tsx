import { useContext } from "react";
import { navigationStore } from "../../context/navigation/navigation.provider";
import { errorStore } from "../../context/errors/errors.provider";
import { mswServer } from "../../setupTests";
import { rest } from "msw";
import { _ } from "react-router/dist/development/fog-of-war-DU_DzpDb";
import { renderHook, waitFor } from "@testing-library/react";
import { useManageCb } from "./use-manage-cb";
import { Redirect } from "../../context/navigation/navigation.actions";
import { Add } from "../../context/errors/errors.actions";

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('useManageCb', () => {
  const mockNavigationDispatch = jest.fn();
  const mockErrorDispatch = jest.fn();
  const originalLocation = window.location

  beforeEach(() => {
    jest.clearAllMocks();
    (useContext as jest.Mock).mockImplementation((context) => {
      if (context === navigationStore) {
        return { dispatch: mockNavigationDispatch };
      } else if (context === errorStore) {
        return { dispatch: mockErrorDispatch };
      }
    });
    const mockLocation = {
      href: "",
    };
    // Apply the mock location to window
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    });
  });
  afterEach(() => {
    window.location = originalLocation; // Restore original location after tests
  });

  test('calls dispatch with Redirect(true) before fetch', async () => {
    mswServer.use(
      rest.get(`${process.env.REACT_APP_API_URL}billing/manage`, (_, res, ctx)=> res(ctx.json({ url: 'https://example.com/session' })))
    )
    const { result } = renderHook(() => useManageCb());

    result.current();

    expect(mockNavigationDispatch).toHaveBeenCalledWith(Redirect(true))
    await waitFor(() => expect(window.location).toBe('https://example.com/session'))
    expect(mockNavigationDispatch).toHaveBeenCalledWith(Redirect(false))
  });

  test('dispatches an error and Redirect(false) on fetch failure', async () => {
    const mockError = new Error('Network error');
    mswServer.use(
      rest.get(`${process.env.REACT_APP_API_URL}billing/manage`, (_, res, ctx)=> res.networkError(mockError.message))
    )

    const { result } = renderHook(() => useManageCb());

    result.current();

    await waitFor(() => expect(mockErrorDispatch).toHaveBeenCalledWith(Add({
      header: 'There was an error fetching sessions URL',
      body: 'Failed to fetch',
      id: expect.anything()
    })));

    expect(mockNavigationDispatch).toHaveBeenCalledWith(Redirect(false));
  });
});
