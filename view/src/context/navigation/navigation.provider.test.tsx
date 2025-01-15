import { useNavigate } from "react-router";
import { usePublicKeys } from "../../hooks/auth/use-keys";
import { useAuth } from "./hooks/use-auth";
import { useLogout } from "./hooks/use-logout";
import { errorStore, initialState } from "../errors/errors.provider";
import { render, screen, waitFor } from "@testing-library/react";
import { NavigationProvider, navigationStore, initialState as navigationInitialState } from "./navigation.provider";
import React from "react";
import { ActionType } from "./navigation.actions";
import { createIdentityToken } from "../../test-utils/identity-factory.test";
import userEvent from "@testing-library/user-event";

jest.mock('../../hooks/auth/use-keys', () => ({
  usePublicKeys: jest.fn(),
}));

jest.mock('react-router', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('./hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('./hooks/use-logout', () => ({
  useLogout: jest.fn(),
}));

const mockUsePublicKeys = usePublicKeys as jest.MockedFunction<typeof usePublicKeys>;
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseLogout = useLogout as jest.MockedFunction<typeof useLogout>;

const mockErrorDispatch = jest.fn();
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <errorStore.Provider value={{ state: initialState, dispatch: mockErrorDispatch }}>
    {children}
  </errorStore.Provider>
);

export const base64UrlEncoder = (msg: string) => btoa(msg).replace(/\+/g, '+').replace(/\//g, '_').replace(/=/g, '')

describe('NavigationProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePublicKeys.mockReturnValue({ publicKeys: {} });
    mockUseNavigate.mockReturnValue(jest.fn());
    mockUseAuth.mockReturnValue({ ready: false, authURL: '', tokens: undefined, loggingIn: false });
    mockUseLogout.mockReturnValue({ loggingOut: false });
    sessionStorage.clear();
  });

  afterEach(() => jest.restoreAllMocks())

  const identityToken = createIdentityToken()

  const TestComponent = () => {
    const { state, dispatch } = React.useContext(navigationStore);
    return (
      <>
        <div data-testid="state">{JSON.stringify(state)}</div>

        <button onClick={() => dispatch({ type: ActionType.Navigate, payload: 'about' })}>Navigate to About</button>
        <button onClick={() => dispatch({ type: ActionType.Redirect, payload: true })}>Set Redirect</button>
        <button onClick={() => dispatch({ type: ActionType.Identity, payload: identityToken })}>Set Identity</button>
        <button onClick={() => dispatch({ type: ActionType.RawIdentity, payload: 'newIdToken' })}>Set Raw Identity</button>

        <button onClick={() => dispatch({ type: ActionType.RawCustomer, payload: 'newCustomerToken' })}>Set Raw Customer</button>
        <button onClick={() => dispatch({ type: ActionType.AuthUrl, payload: 'newAuthUrl' })}>Set Auth URL</button>
      </>
    );
  };

  it('provides the initial state', () => {
    render(
      <TestWrapper>
        <NavigationProvider>
          <TestComponent />
        </NavigationProvider>
      </TestWrapper>
    );

    const stateElement = screen.getByTestId('state');

    expect(stateElement.textContent).toEqual(JSON.stringify(navigationInitialState));
  });

  it('loads state from sessionStorage if available', () => {
    const mockState = {
      ...navigationInitialState,
      rawIdentityToken: 'testIdentityToken',
      rawCustomerToken: 'testCustomerToken',
    };

    sessionStorage.setItem('identity_storage', 'testIdentityToken');
    sessionStorage.setItem('customer', 'testCustomerToken');

    render(
      <TestWrapper>
        <NavigationProvider>
          <TestComponent />
        </NavigationProvider>
      </TestWrapper>
    );

    const stateElement = screen.getByTestId('state');

    expect(stateElement.textContent).toEqual(JSON.stringify(mockState));
  });

  it('updates the state when dispatching actions', async () => {
    render(
      <TestWrapper>
        <NavigationProvider>
          <TestComponent />
        </NavigationProvider>
      </TestWrapper>
    );

    const stateElement = screen.getByTestId('state');

    // Initial state
    expect(stateElement.textContent).toEqual(JSON.stringify(navigationInitialState));

    // Navigate to About
    userEvent.click(screen.getByText('Navigate to About'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...navigationInitialState,
      navigation: [
        { name: 'Home', id: 'home', current: false },
        { name: 'About', id: 'about', current: true },
      ],
    }));

    // Set Redirect
    userEvent.click(screen.getByText('Set Redirect'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...navigationInitialState,
      navigation: [
        { name: 'Home', id: 'home', current: false },
        { name: 'About', id: 'about', current: true },
      ],
      redirect: true,
    }));

    // Set Identity
    userEvent.click(screen.getByText('Set Identity'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...navigationInitialState,
      navigation: [
        { name: 'Home', id: 'home', current: false },
        { name: 'About', id: 'about', current: true },
      ],
      redirect: true,
      identityToken: identityToken,
    }));

    // Set Raw Identity
    userEvent.click(screen.getByText('Set Raw Identity'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...navigationInitialState,
      navigation: [
        { name: 'Home', id: 'home', current: false },
        { name: 'About', id: 'about', current: true },
      ],
      redirect: true,
      identityToken: identityToken,
      rawIdentityToken: 'newIdToken',
    }));

    // Set Raw Customer
    userEvent.click(screen.getByText('Set Raw Customer'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...navigationInitialState,
      navigation: [
        { name: 'Home', id: 'home', current: false },
        { name: 'About', id: 'about', current: true },
      ],
      redirect: true,
      identityToken: identityToken,
      rawIdentityToken: 'newIdToken',
      rawCustomerToken: 'newCustomerToken',
    }));

    // Set Auth URL
    userEvent.click(screen.getByText('Set Auth URL'));
    expect(stateElement.textContent).toEqual(JSON.stringify({
      ...navigationInitialState,
      navigation: [
        { name: 'Home', id: 'home', current: false },
        { name: 'About', id: 'about', current: true },
      ],
      redirect: true,
      identityToken: identityToken,
      rawIdentityToken: 'newIdToken',
      rawCustomerToken: 'newCustomerToken',
      authUrl: 'newAuthUrl',
    }));

    // Check if sessionStorage is updated
    expect(sessionStorage.getItem('identity_storage')).toEqual('newIdToken');
    expect(sessionStorage.getItem('customer')).toEqual('newCustomerToken');
  });

  it('validates and updates identity token', async () => {
    const cryptoKeys = await crypto.subtle
      .generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify']
      ) as CryptoKeyPair
    const {e, n, kty} = await crypto.subtle.exportKey('jwk', cryptoKeys.publicKey) as {e: string, n: string, kty: string}
    mockUsePublicKeys.mockReturnValue({ publicKeys: { 'mockKid': {e, n, kty} } });

    const exp =  Math.floor(Date.now() / 1000) + 3600
    const payload = {
      ...identityToken.payload,
      exp
    }
    const header = base64UrlEncoder(JSON.stringify({ kid: 'some-id' }))
    const payload64 = base64UrlEncoder(JSON.stringify(payload))
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKeys.privateKey, new TextEncoder().encode(`${header}.${payload64}`))
    const sig64 = base64UrlEncoder(String.fromCharCode(...new Uint8Array(signature)))
    const validMockJwt = [header, payload64, sig64].join('.'); // Example JWT, you need a valid form

    sessionStorage.setItem('identity_storage', validMockJwt);

    const mockNavigate = jest.fn();
    mockUseNavigate.mockReturnValue(mockNavigate);

    render(
      <TestWrapper>
        <NavigationProvider>
          <TestComponent />
        </NavigationProvider>
      </TestWrapper>
    );

    const stateElement = screen.getByTestId('state');

    await waitFor(() => {
      const state = JSON.parse(stateElement.textContent!);
      expect(state.identityToken).not.toBeNull();
    })
    const state = JSON.parse(stateElement.textContent!);
    expect(state.identityToken?.payload.aud).toBe(process.env.REACT_APP_AUTH_CLIENT_ID);
    expect(state.identityToken?.payload.exp).toBe(exp);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles invalid token and logs outs', async () => {

    const cryptoKeys = await crypto.subtle
      .generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify']
      ) as CryptoKeyPair
    const {e, n, kty} = await crypto.subtle.exportKey('jwk', cryptoKeys.publicKey) as {e: string, n: string, kty: string}
    mockUsePublicKeys.mockReturnValue({ publicKeys: { 'mockKid': {e, n, kty} } });

    const mockJwt = 'eyJraWQiOiJzb21lLWlkIn0.eyJoZWFkZXIiOnsiYWxnIjoiUlMyNTYiLCJraWQiOiJzb21lLWtleS1pZCIsInR5cCI6IkpXVCJ9LCJwYXlsb2FkIjp7ImV4cCI6MTY3MjUzNDgwMCwibmJmIjoxNjcyNTMxMjAwLCJ2ZXIiOiIxLjAiLCJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tIiwic3ViIjoidXNlcjEyMyIsImF1ZCI6ImNsaWVudC1hcHAiLCJpYXQiOjE2NzI1MzEyMDAsImF1dGhfdGltZSI6MTY3MjUzMTIwMCwib2lkIjoidXNlci1vaWQiLCJuYW1lIjoiSm9obiBEb2UiLCJ0ZnAiOiJCMkNfMV9TaWduVXBPclNpZ25JbiIsImF0X2hhc2giOiJzb21lLWF0LWhhc2gifSwic2lnbmF0dXJlIjoic29tZS1zaWduYXR1cmUifQ.iwW9BZ_wjMJsG1uk02Fpz1yXGE_HPKu6NhAJ4tcjM8dMLGGWWJJe+6Y00tn4RjFqgQr6l9zn7fWC2CAuMcHZCfKpYt53IsuFbzAEP+7tA9kSe54ISZHz+CMil1O11zfJsTjLll5DqoTk1DfMaVj_ourfT3F16xRWUUnMc8FzAsLMhW1dnnWHbIMkPqN2px5bFQF5oDpYXhF1CO3ruS7pY7utkIo34kngp6kBt7zCcgZMlzfi+WrmTuQcpw9F8oKXaM6hIeTaV+ckNvlNVsFYZuecFnExCax6ueyV2qpEs0TyUtny56psDhcvraJ1L+Gg_REjjaLc1VT6vgKuq6Ds+w';
    sessionStorage.setItem('identity_storage', mockJwt);

    render(
      <TestWrapper>
        <NavigationProvider>
          <TestComponent />
        </NavigationProvider>
      </TestWrapper>
    );

    const stateElement = screen.getByTestId('state');

    await waitFor(() => {
      const state = JSON.parse(stateElement.textContent!);
      expect(state.rawCustomerToken).toBe('')
    });
  });

  it('updates authUrl when auth is ready', async () => {
    mockUseAuth.mockReturnValue({ ready: true, authURL: 'testAuthUrl', tokens: undefined, loggingIn: false });

    render(
      <TestWrapper>
        <NavigationProvider>
          <TestComponent />
        </NavigationProvider>
      </TestWrapper>
    );

    const stateElement = screen.getByTestId('state');

    await waitFor(() => {
      const state = JSON.parse(stateElement.textContent!);
      expect(state.authUrl).toBe('testAuthUrl');
    });
  });

  it('updates redirect state when logging in or out', async () => {
    mockUseAuth.mockReturnValue({ ready: true, authURL: 'testAuthUrl', tokens: undefined, loggingIn: true });
    mockUseLogout.mockReturnValue({ loggingOut: true });

    const { rerender } = render(
      <TestWrapper>
        <NavigationProvider>
          <TestComponent />
        </NavigationProvider>
      </TestWrapper>
    );

    const stateElement = screen.getByTestId('state');

    await waitFor(() =>{
      const state = JSON.parse(stateElement.textContent!);
      expect(state.redirect).toBe(true);

    })

    mockUseAuth.mockReturnValue({ ready: true, authURL: 'testAuthUrl', tokens: undefined, loggingIn: false });
    mockUseLogout.mockReturnValue({ loggingOut: false });

    rerender(
      <TestWrapper>
        <NavigationProvider>
          <TestComponent />
        </NavigationProvider>
      </TestWrapper>
    )

    await waitFor(() => {
      const state = JSON.parse(screen.getByTestId('state').textContent!);
      expect(state.redirect).toBe(false);
    });
  });

  it('updates tokens when received from useAuth', () => {
    mockUseAuth.mockReturnValue({ ready: true, authURL: 'testAuthUrl', tokens: { id_token: 'newIdToken', customer_token: 'newCustomerToken' }, loggingIn: false });

    render(
      <TestWrapper>
        <NavigationProvider>
          <TestComponent />
        </NavigationProvider>
      </TestWrapper>
    );

    const stateElement = screen.getByTestId('state');

    const state = JSON.parse(stateElement.textContent!);
    expect(state.rawIdentityToken).toBe('newIdToken');
    expect(state.rawCustomerToken).toBe('newCustomerToken');
    expect(sessionStorage.getItem('identity_storage')).toBe('newIdToken');
    expect(sessionStorage.getItem('customer')).toBe('newCustomerToken');
  });

  it('clears tokens when logout is complete', async () => {
    mockUseLogout.mockReturnValue({ loggingOut: true });

    const {rerender} =render(
      <TestWrapper>
        <NavigationProvider>
          <TestComponent />
        </NavigationProvider>
      </TestWrapper>
    );

    mockUseLogout.mockReturnValue({ loggingOut: false });

    // Re-render to simulate a change in the hooks
    rerender(
      <TestWrapper>
        <NavigationProvider>
          <TestComponent />
        </NavigationProvider>
      </TestWrapper>
    );

    await waitFor(() => {
      const state = JSON.parse(screen.getByTestId('state').textContent!);
      expect(state.rawIdentityToken).toBe('');
    });
    const state = JSON.parse(screen.getByTestId('state').textContent!);
    expect(state.rawCustomerToken).toBe('');
    expect(sessionStorage.getItem('identity_storage')).toBe('');
    expect(sessionStorage.getItem('customer')).toBe('');
  });
});
