import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomExecutionContext } from "../../../src/utils/middleware";
import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { keyHandler } from "../../../src/handlers/keys/keys-handler";

let ctx: CustomExecutionContext;
beforeEach(() => {
  ctx = createExecutionContext();
});

afterEach(() => {
  waitOnExecutionContext(ctx);
});

afterAll(() => {
  vi.clearAllMocks();
  vi.resetModules();
});
describe('keyHandler', () => {
  it('should return the correct JSON response with proper headers', async () => {
    // Mock the RequestMuxProperties
    const mockEnv = {
      ...env,
      RSA_PRIVATE_KEY: JSON.stringify({
        alg: 'RS256',
        e: 'AQAB',
        kty: 'RSA',
        n: 'some-long-base64-encoded-string'
      })
    };

    // Call the keyHandler function
    const request = new Request("http://test")
    const response = await keyHandler({ request, env: mockEnv, ctx });

    // Check if the response is an instance of Response
    expect(response).toBeInstanceOf(Response);

    // Check the status code
    expect(response.status).toBe(200);

    // Check the headers
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Cache-Control')).toBe('max-age=900000');

    // Check the JSON body
    const jsonBody = await response.json();
    expect(jsonBody).toEqual({
      alg: 'RS256',
      e: 'AQAB',
      kty: 'RSA',
      n: 'some-long-base64-encoded-string'
    });
  });

  it('should handle invalid RSA_PRIVATE_KEY', async () => {
    // Mock the RequestMuxProperties with an invalid RSA_PRIVATE_KEY
    const mockEnv = {
      ...env,
      RSA_PRIVATE_KEY: 'invalid-json'
    };

    // Call the keyHandler function
    const request = new Request("http://test")
    await expect(async () => await keyHandler({ request, env: mockEnv, ctx })).rejects.toThrow;
  });
});
