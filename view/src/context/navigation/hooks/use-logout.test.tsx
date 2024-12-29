import { useLocation, useNavigate } from "react-router";
import { errorStore, initialState } from "../../errors/errors.provider";
import { renderHook, waitFor } from "@testing-library/react";
import { useLogout } from "./use-logout";
import { mswServer } from "../../../setupTests";
import { rest } from "msw";
import { Add } from "../../errors/errors.actions";

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

describe('useLogout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/', hash: '', state: '', key: 'test', search: '' });
    mockUseNavigate.mockReturnValue(jest.fn());
  });

  it('should not initiate logout when not on logout page', async () => {
    const mockNavigate = jest.fn()
    mockUseNavigate.mockReturnValueOnce(mockNavigate)
    const { result } = renderHook(() => useLogout('testToken'), { wrapper: TestWrapper });

    expect(result.current.loggingOut).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockErrorDispatch).not.toHaveBeenCalled();
  });

  it('should initiate logout when on logout page', async () => {
    mockUseLocation.mockReturnValue({ pathname: '/logout', hash: '', state: '', key: 'test', search: '' });
    const mockNavigate = jest.fn();
    mockUseNavigate.mockReturnValue(mockNavigate);

    mswServer.use(
      rest.post(`${process.env.REACT_APP_API_URL}auth/logout`, (_, res, ctx) => {
        return res(ctx.json({ redirect_uri: 'https://example.com' }));
      })
    );

    const { result } = renderHook(() => useLogout('testToken'), { wrapper: TestWrapper });

    expect(result.current.loggingOut).toBe(true);

    await waitFor(() => expect(result.current.loggingOut).toBe(false));

    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(mockErrorDispatch).not.toHaveBeenCalled();
  });

  it('should handle logout error', async () => {
    mockUseLocation.mockReturnValue({ pathname: '/logout', hash: '', state: '', key: 'test', search: '' });
    const mockNavigate = jest.fn();
    mockUseNavigate.mockReturnValue(mockNavigate);

    mswServer.use(
      rest.post(`${process.env.REACT_APP_API_URL}auth/logout`, (_, res, ctx) => res.networkError('Server Error')
    ));

    const { result } = renderHook(() => useLogout('testToken'), { wrapper: TestWrapper });

    expect(result.current.loggingOut).toBe(true);

    await waitFor(() => expect(result.current.loggingOut).toBe(false));

    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(mockErrorDispatch).toHaveBeenCalledWith(
      Add({
        header: 'useAuth::There was an error fetching token',
        body: 'Failed to fetch',
        id: expect.anything()
      })
    );
  });
});
