// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { webcrypto } from 'crypto';
import "fake-indexeddb/auto";
import { setupServer } from 'msw/node';
import { TextEncoder } from 'util'

global.TextEncoder = TextEncoder
global.crypto = webcrypto as Crypto

export const mockIntersectionObserver = jest.fn();

global.structuredClone = (val) => JSON.parse(JSON.stringify(val))

beforeEach(() => {
  // IntersectionObserver isn't available in test environment
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  });
  window.IntersectionObserver = mockIntersectionObserver;

  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))

  Object.defineProperty(window, 'performance', {
    writable: true,
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

// mws
export const mswServer = setupServer()

beforeAll(() => mswServer.listen())

afterAll(() => mswServer.close())
afterEach(() => mswServer.resetHandlers())
