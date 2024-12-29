import { render, screen, fireEvent } from '@testing-library/react';
import { initialState, navigationStore } from '../context/navigation/navigation.provider';
import { IdentityToken } from '../context/navigation/navigation.actions';
import { LoginButton } from './login-button';
import { createIdentityToken } from '../test-utils/identity-factory.test';
import { Menu } from '@headlessui/react';

jest.mock('../hooks/auth/use-login-cb', () => ({
  useLoginCb: jest.fn(),
}));

const mockUseLoginCb = require('../hooks/auth/use-login-cb').useLoginCb;

interface TestWrapperProps {
  children: React.ReactNode
  identityToken?: IdentityToken | null
}

const TestWrapper = ({ children, identityToken = null }: TestWrapperProps) => (
  <navigationStore.Provider value={{ state: { ...initialState, identityToken }, dispatch: jest.fn() }}>
    <Menu>{children}</Menu>
  </navigationStore.Provider>
);

describe('LoginButton', () => {
  it('renders "Login" when no identity token is provided', () => {
    render(<TestWrapper><LoginButton /></TestWrapper>);

    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('renders a personalized greeting when an identity token is provided', () => {
    const mockIdentityToken = { payload: { name: 'John Doe' } };
    render(<TestWrapper identityToken={createIdentityToken(mockIdentityToken)}><LoginButton /></TestWrapper>);

    expect(screen.getByText(`Hi ${mockIdentityToken.payload.name}`)).toBeInTheDocument();
  });

  it('calls the login callback when clicked and no identity token is present', () => {
    const mockCb = jest.fn();
    mockUseLoginCb.mockReturnValue(mockCb);

    render(<TestWrapper><LoginButton /></TestWrapper>);

    fireEvent.click(screen.getByText('Login'));

    expect(mockCb).toHaveBeenCalledTimes(1);
  });
});
