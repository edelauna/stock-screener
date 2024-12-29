import { useContext } from "react";
import { navigationStore } from "../../context/navigation/navigation.provider";
import { renderHook } from "@testing-library/react";
import { useUpgradeCb } from "./use-upgrade-cb";
import { Redirect } from "../../context/navigation/navigation.actions";

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('useUpgradeCb', () => {
  const mockNavigationDispatch = jest.fn();
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    (useContext as jest.Mock).mockImplementation((context) => {
      if (context === navigationStore) {
        return { dispatch: mockNavigationDispatch };
      }
    });
    const mockLocation = {
      assign: jest.fn(),
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

  test('redirects to Stripe payment link and dispatches Redirect(true) when link is set', () => {
    process.env.REACT_APP_STRIPE_PAYMENT_LINK = 'https://stripe.example.com/payment';

    const { result } = renderHook(() => useUpgradeCb());

    result.current();

    expect(mockNavigationDispatch).toHaveBeenCalledWith(Redirect(true));

    expect(window.location.assign).toHaveBeenCalledWith('https://stripe.example.com/payment');
  });
});
