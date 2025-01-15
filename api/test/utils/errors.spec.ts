import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from "vitest";
import { internalServerError } from "../../src/utils/errors";

let consoleLogSpy: MockInstance<() => string>
beforeEach(() => {
  consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
})
afterEach(() => consoleLogSpy.mockRestore())
// Mock the crypto.randomUUID function
const x = vi.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid-1234');

describe('internalServerError', () => {
  it('should return a 500 response with correct structure', async () => {
    const msg = 'Test error message';
    const ctx = { additional: 'context' };

    const response = await internalServerError(msg, ctx);

    // Check the response status and status text
    expect(response.status).toBe(500);
    expect(response.statusText).toBe('Internal Server Error');

    // Check the response headers
    expect(response.headers.get('Content-Type')).toBe('application/json');

    // Check the response body
    const jsonBody = await response.json();
    expect(jsonBody).toEqual({
      message: expect.stringContaining('Server Error'),
      requestId: 'mock-uuid-1234'
    });

    // Check the console.log call
    expect(consoleLogSpy).toHaveBeenCalledWith({
      error: msg,
      requestId: 'mock-uuid-1234',
      ...ctx
    });
  });

  it('should handle null context', async () => {
    const msg = 'Another test error';

    const response = await internalServerError(msg);

    // Check the response status and status text
    expect(response.status).toBe(500);
    expect(response.statusText).toBe('Internal Server Error');

    // Check the response headers
    expect(response.headers.get('Content-Type')).toBe('application/json');

    // Check the response body
    const jsonBody = await response.json();
    expect(jsonBody).toEqual({
      message: expect.stringContaining('Server Error'),

      requestId: 'mock-uuid-1234'
    });

    // Check the console.log call
    expect(consoleLogSpy).toHaveBeenCalledWith({
      error: msg,
      requestId: 'mock-uuid-1234'
    });
  });
});
