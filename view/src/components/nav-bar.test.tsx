import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { initialState, NavigationItem, navigationStore } from '../context/navigation/navigation.provider';
import { Navigate } from '../context/navigation/navigation.actions';
import React from 'react';
import { NavBar } from './nav-bar';
import userEvent from '@testing-library/user-event';

jest.mock('./user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}));

const mockDispatch = jest.fn();
const mockScrollTo = jest.fn();
const mockNavigationItems: NavigationItem[] = [
  { id: 'home', name: 'Home', current: true },
  { id: 'about', name: 'About', current: false },
];

interface TestWrapperProps {
  children: React.ReactNode,
  navigation?: NavigationItem[]
}

const TestWrapper = ({ children, navigation = mockNavigationItems }: TestWrapperProps) => (
  <navigationStore.Provider value={{ state: { ...initialState, navigation }, dispatch: mockDispatch }}>
    {children}
  </navigationStore.Provider>
);

const originalScrollTo = window.scrollTo;
beforeAll(() => {
  window.scrollTo = mockScrollTo;
});

afterAll(() => {
  window.scrollTo = originalScrollTo;
});

describe('NavBar', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockScrollTo.mockClear();
  });

  it('renders the logo', () => {
    render(<TestWrapper><NavBar /></TestWrapper>);

    expect(screen.getByAltText('Lokeel')).toBeInTheDocument();
  });

  it('renders the navigation items on desktop', () => {
    render(<TestWrapper><NavBar /></TestWrapper>);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('applies correct classes to navigation items', () => {
    render(<TestWrapper><NavBar /></TestWrapper>);

    const homeButton = screen.getByText('Home');

    expect(homeButton).toHaveClass('bg-gray-900 text-white rounded-md px-3 py-2 text-sm font-medium');

    const aboutButton = screen.getByText('About');
    expect(aboutButton).toHaveClass('text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium');
  });

  it('renders the mobile menu button', () => {
    render(<TestWrapper><NavBar /></TestWrapper>);

    expect(screen.getByRole('button', { name: 'Open main menu' })).toBeVisible();
    expect(screen.getByTestId('bars-icon')).toBeInTheDocument();
  });

  it('renders the UserMenu component', () => {
    render(<TestWrapper><NavBar /></TestWrapper>);

    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('triggers scroll to section and dispatches Navigate action on navigation item click', async () => {
    // about id is the second navigation item
    render(<TestWrapper><NavBar /><div id={mockNavigationItems[1].id} /></TestWrapper>);

    const aboutButton = screen.getByText('About');

    fireEvent.click(aboutButton);

    await waitFor(() => {
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      });
    });
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(Navigate('about'));
    });
  });

  it('renders navigation items in mobile view', () => {
    render(<TestWrapper><NavBar /></TestWrapper>);

    const mobileMenuButton = screen.getByRole('button', { name: 'Open main menu' });

    userEvent.click(mobileMenuButton);
    // gets double rendered during test since can't specify viewport
    screen.getAllByText('Home').forEach(el =>expect(el).toBeInTheDocument())
    screen.getAllByText('About').forEach(el =>expect(el).toBeInTheDocument())
  });
});
