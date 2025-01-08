import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { initialState, navigationStore } from '../context/navigation/navigation.provider';
import { useNavigate } from 'react-router';
import { useCustomer } from '../hooks/billing/use-customer-hook/use-customer';
import { useManageCb } from '../hooks/billing/use-manage-cb';
import { useUpgradeCb } from '../hooks/billing/use-upgrade-cb';
import { useUpdateCustomer } from '../hooks/billing/use-customer-hook/use-update-customer';
import { IdentityToken } from '../context/navigation/navigation.actions';
import { UserMenu } from './user-menu';
import { createCustomer } from '../test-utils/customer-factory.test';
import { createIdentityToken } from '../test-utils/identity-factory.test';

jest.mock('@headlessui/react', () => ({
  ...jest.requireActual("@headlessui/react"),
  // for some reason MenuItems arn't rendering in render
  MenuItems: ({ children }: {children: React.ReactNode}) => <div data-testid="menu-items">{children}</div>,
}));

jest.mock('./login-button', () => ({
  LoginButton: () => <button data-testid="login-button">Login Button</button>,
}));

jest.mock('react-router', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../hooks/billing/use-customer-hook/use-customer', () => ({
  useCustomer: jest.fn(),
}));

jest.mock('../hooks/billing/use-manage-cb', () => ({
  useManageCb: jest.fn(),
}));

jest.mock('../hooks/billing/use-upgrade-cb', () => ({
  useUpgradeCb: jest.fn(),
}));

jest.mock('../hooks/billing/use-customer-hook/use-update-customer', () => ({
  useUpdateCustomer: jest.fn(),
}));

const mockUseNavigate = useNavigate  as jest.MockedFunction<typeof useNavigate>;
const mockUseCustomer = useCustomer as jest.MockedFunction<typeof useCustomer>;
const mockUseManageCb = useManageCb as jest.MockedFunction<typeof useManageCb>;
const mockUseUpgradeCb = useUpgradeCb as jest.MockedFunction<typeof useUpgradeCb>;
const mockUseUpdateCustomer = useUpdateCustomer as jest.MockedFunction<typeof useUpdateCustomer>;

interface TestWrapperProps {
  children: React.ReactNode,
  identityToken?: IdentityToken | null,
}
const TestWrapper = ({ children, identityToken = null }: TestWrapperProps) => (
  <navigationStore.Provider value={{ state: { ...initialState, identityToken }, dispatch: jest.fn() }}>
    {children}
  </navigationStore.Provider>
);

describe('UserMenu', () => {
  beforeEach(() => {
    mockUseNavigate.mockReturnValue(jest.fn());
    mockUseCustomer.mockReturnValue({ customer: undefined });
    mockUseManageCb.mockReturnValue(jest.fn());
    mockUseUpgradeCb.mockReturnValue(jest.fn());
  });

  it('renders the LoginButton', () => {
    render(<TestWrapper><UserMenu /></TestWrapper>);

    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('does not render menu items when no identity token is present', () => {
    render(<TestWrapper><UserMenu /></TestWrapper>);

    expect(screen.queryByText('Manage')).not.toBeInTheDocument();
    expect(screen.queryByText('Upgrade')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
  });

  it('renders "Manage" menu item when identity token and customer are present', async () => {
    const mockCustomer = { customer: {id: '123'} };

    mockUseCustomer.mockReturnValue({ customer: createCustomer(mockCustomer) });

    render(<TestWrapper identityToken={createIdentityToken({ payload: { name: 'John Doe' } })}><UserMenu /></TestWrapper>);

    expect(await screen.findByText('Manage')).toBeInTheDocument();
    expect(screen.queryByText('Upgrade')).not.toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('renders "Upgrade" menu item when identity token is present but no customer', () => {

    render(<TestWrapper identityToken={createIdentityToken({ payload: { name: 'John Doe' } })}><UserMenu /></TestWrapper>);

    expect(screen.queryByText('Manage')).not.toBeInTheDocument();
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('calls manage callback when "Manage" menu item is clicked', () => {
    const mockCustomer = { customer: {id: '123'} };
    const mockManageCb = jest.fn();

    mockUseCustomer.mockReturnValue({ customer: createCustomer(mockCustomer) });
    mockUseManageCb.mockReturnValue(mockManageCb);

    render(<TestWrapper identityToken={createIdentityToken({ payload: { name: 'John Doe' } })}><UserMenu /></TestWrapper>);

    fireEvent.click(screen.getByText('Manage'));

    expect(mockManageCb).toHaveBeenCalledTimes(1);
  });

  it('calls upgrade callback when "Upgrade" menu item is clicked', () => {
    const mockUpgradeCb = jest.fn();

    mockUseUpgradeCb.mockReturnValue(mockUpgradeCb);

    render(<TestWrapper identityToken={createIdentityToken({ payload: { name: 'John Doe' } })}><UserMenu /></TestWrapper>);

    fireEvent.click(screen.getByText('Upgrade'));

    expect(mockUpgradeCb).toHaveBeenCalledTimes(1);
  });

  it('calls navigate to logout when "Sign out" menu item is clicked', () => {
    const mockNavigate = jest.fn();
    mockUseNavigate.mockReturnValue(mockNavigate);

    render(<TestWrapper identityToken={createIdentityToken({ payload: { name: 'John Doe' } })}><UserMenu /></TestWrapper>);

    fireEvent.click(screen.getByText('Sign out'));

    expect(mockNavigate).toHaveBeenCalledWith('/logout');
  });

  it('calls useUpdateCustomer hook', () => {
    render(<TestWrapper identityToken={createIdentityToken({ payload: { name: 'John Doe' } })}><UserMenu /></TestWrapper>);

    expect(mockUseUpdateCustomer).toHaveBeenCalledTimes(1);
  });
});
