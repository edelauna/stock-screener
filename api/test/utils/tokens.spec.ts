import { createExecutionContext, env, fetchMock } from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { refreshAccessToken } from "../../src/utils/tokens";
import { CustomExecutionContext } from "../../src/utils/middleware";

describe('refreshAccessToken function', () => {
  beforeAll(() => {
    // Enable outbound request mocking...
    fetchMock.activate();
    // ...and throw errors if an outbound request isn't mocked
    fetchMock.disableNetConnect();
  });

  afterEach(() => fetchMock.assertNoPendingInterceptors());

  it('should successfully refresh the access token', async () => {
    const ctx: CustomExecutionContext = createExecutionContext();

    const refreshToken = 'dummy-refresh-token';

    // Mock the fetch request to return a successful response
    fetchMock.get('https://lokeel.b2clogin.com')
      .intercept({
        method: 'POST',
        path: 'lokeel.onmicrosoft.com/B2C_1_simple_screener_lokeel_user_flow/oauth2/v2.0/token'
      })
      .reply(200, {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token'
      });

    const result = await refreshAccessToken(refreshToken, env, ctx);

    expect(result).toBe(true);
    expect(ctx.newAccessToken).toBe('new-access-token');
    expect(ctx.newRefreshToken).toBe('new-refresh-token');
  });

  it('should return false if the token refresh fails', async () => {
    const ctx: CustomExecutionContext = createExecutionContext();

    const refreshToken = 'dummy-refresh-token';

    // Mock the fetch request to return a failed response
    fetchMock.get('https://lokeel.b2clogin.com')
      .intercept({
        method: 'POST',
        path: 'lokeel.onmicrosoft.com/B2C_1_simple_screener_lokeel_user_flow/oauth2/v2.0/token'
      })
      .reply(400, 'Refresh token has expired.');

    const result = await refreshAccessToken(refreshToken, env, ctx);

    expect(result).toBe(false);
    expect(ctx.newAccessToken).toBeUndefined(); // Check that new tokens are not set
    expect(ctx.newRefreshToken).toBeUndefined(); // Check that new tokens are not set
  });
});
