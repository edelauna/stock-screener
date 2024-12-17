// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { webcrypto } from 'crypto';
import "fake-indexeddb/auto";
import { TextEncoder } from 'util'

global.TextEncoder = TextEncoder
global.crypto = webcrypto as Crypto

beforeEach(() => {
  // IntersectionObserver isn't available in test environment
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.IntersectionObserver = mockIntersectionObserver;

  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))

  Object.defineProperty(window, 'performance', {
    value: {
      getEntriesByType: jest.fn().mockReturnValue([
        {
          type: 'navigate',
          toJSON: () => ({ type: 'navigate' }),
        } as PerformanceNavigationTiming,
      ]),
    },
  });
});
