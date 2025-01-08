import { renderHook, waitFor, act } from "@testing-library/react";
import { errorStore, initialState } from "../../errors/errors.provider";
import { useAuth } from "./use-auth";
import { useLocation, useNavigate } from "react-router";
import { rest } from 'msw'
import { Add } from "../../errors/errors.actions";
import { mswServer } from "../../../setupTests";

jest.mock('react-router', () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));


const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;

const mockErrorDispatch = jest.fn();
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <errorStore.Provider value={{ state: initialState, dispatch: mockErrorDispatch }}>
    {children}
  </errorStore.Provider>
);



describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/', hash: '', state: 'dne', key: 'test', search: '' });
    mockUseNavigate.mockReturnValue(jest.fn());
  });

  it('initializes with the correct state', async () => {
    const { result, unmount } = renderHook(() => useAuth(), { wrapper: TestWrapper });

    expect(result.current.ready).toBe(false);
    expect(result.current.loggingIn).toBe(false);
    expect(result.current.tokens).toBeUndefined();
    expect(result.current.authURL).toContain('code_challenge=null');

    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.authURL).not.toContain('code_challenge=null');

    await waitFor(() => unmount())
  });

  it('generates a new verifier when the current one expires', async () => {
    jest.useFakeTimers();
    const { result, unmount } = renderHook(() => useAuth(), { wrapper: TestWrapper });

    await waitFor(() => expect(result.current.ready).toBe(true))

    const initialChallange = result.current.authURL?.split('code_challenge=')[1];

    act(() => jest.runOnlyPendingTimers())

    await waitFor(() => {
      const newChallenge = result.current.authURL?.split('code_challenge=')[1];
      expect(initialChallange).not.toBe(newChallenge)
    });

    jest.useRealTimers();

    await waitFor(() => unmount())
  });

  it('handles login flow correctly', async () => {
    mswServer.use(
      rest.post(`${process.env.REACT_APP_API_URL}auth/token`, (_, res, ctx) => res(ctx.json(
        {id_token: 'id_token', customer_token: 'customer_token'}
      )))
    )
    mockUseLocation.mockReturnValue({ pathname: '/auth', hash: '#code=12345', state: 'dne', key: 'test', search: '' });
    const mockNavigate = jest.fn();
    mockUseNavigate.mockReturnValue(mockNavigate);

    const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

    expect(result.current.loggingIn).toBe(true);
    await waitFor(() => expect(result.current.loggingIn).toBe(false))
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(mockErrorDispatch).not.toHaveBeenCalled();
  });

  it('handles login error correctly', async () => {
    mockUseLocation.mockReturnValue({ pathname: '/auth', hash: '#code=12345', state: 'dne', key: 'test', search: '' });
    const mockNavigate = jest.fn();
    mockUseNavigate.mockReturnValue(mockNavigate);

    mswServer.use(
      rest.post(`${process.env.REACT_APP_API_URL}auth/token`, (_, res, ctx) => res(
        ctx.status(500),
        ctx.text('Error Message'))
    ))

    const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

    expect(result.current.loggingIn).toBe(true);
    await waitFor(() => expect(result.current.loggingIn).toBe(false))
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(mockErrorDispatch).toHaveBeenCalledWith(
      Add({
        header: 'useAuth::Fetch token response not ok',
        body: 'Error Message',
        id: expect.anything()
      })
    );
  });

  it('handles fetch error correctly', async () => {
    mockUseLocation.mockReturnValue({ pathname: '/auth', hash: '#code=12345', state: 'dne', key: 'test', search: '' });
    const mockNavigate = jest.fn();
    mockUseNavigate.mockReturnValue(mockNavigate);

    mswServer.use(
      rest.post(`${process.env.REACT_APP_API_URL}auth/token`, (_, res, ctx) => res.networkError("Erro Message")
    ))

    const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

    expect(result.current.loggingIn).toBe(true);
    await waitFor(() => expect(result.current.loggingIn).toBe(false))
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(mockErrorDispatch).toHaveBeenCalledWith(
      Add({
        header: 'useAuth::There was an error fetching token',
        body: 'Failed to fetch',
        id: expect.anything()
      })
    );
  });

  it('does not trigger login flow if code is the same as lastCodeRef', async () => {
    mockUseLocation.mockReturnValue({ pathname: '/auth', hash: '#code=12345', state: 'dne', key: 'test', search: '' });
    const mockNavigate = jest.fn();
    mockUseNavigate.mockReturnValue(mockNavigate);

    mswServer.use(
      rest.post(`${process.env.REACT_APP_API_URL}auth/token`, (_, res, ctx) => res(
        ctx.json({ id_token: 'idToken', customer_token: 'customerToken' })
      )
    ))

    const { result, rerender } = renderHook(() => useAuth(), { wrapper: TestWrapper });

    expect(result.current.loggingIn).toBe(true);

    await waitFor(() => expect(result.current.loggingIn).toBe(false))

    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(mockErrorDispatch).not.toHaveBeenCalled();

    expect(result.current.tokens).toEqual({ id_token: 'idToken', customer_token: 'customerToken' });

    rerender();

    await waitFor(() => expect(result.current.loggingIn).toBe(false))

    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});
