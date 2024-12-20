import { env, createExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi, afterAll } from 'vitest'
import { CustomExecutionContext, reqAuthMiddleware } from '../../src/utils/middleware';
import * as jwt from '../../src/utils/jwt';
import * as tokens from '../../src/utils/tokens';
import * as cookies from '../../src/utils/cookies';

vi.mock("../../src/utils/jwt")
vi.mock("../../src/utils/tokens")
vi.mock("../../src/utils/cookies")

afterAll(() => {
    vi.clearAllMocks()
    vi.resetModules()
})

describe('reqAuthMiddleware', () => {
    const createRequest = (cookieString: string) => new Request('http://example.com', {
        headers: { 'Cookie': cookieString },
    });

    it('should set ctx.logout to true and clear user and customer when access token is invalid', async () => {
        const ctx: CustomExecutionContext = createExecutionContext();
        const request = createRequest('access_token=invalid_token; refresh_token=valid_refresh_token; customer=valid_customer_token');

        // Mock implementations
        vi.mocked(jwt.verify).mockResolvedValueOnce({ isVerified: false, expired: false });
        const result = await reqAuthMiddleware({ request, env, ctx });


        expect(ctx.logout).toBe(true);
        expect(ctx.user).toBeUndefined();
        expect(ctx.customer).toBeUndefined();
        expect(result.ctx).toBe(ctx); // Ensure context is passed along
    });

    it('should refresh access token if expired and refresh token is present', async () => {
        const ctx: CustomExecutionContext = createExecutionContext();
        const request = createRequest('access_token=expired_token; refresh_token=valid_refresh_token');

        // Mock implementations
        vi.mocked(jwt.verify).mockResolvedValueOnce({ isVerified: true, expired: true });
        vi.mocked(tokens.refreshAccessToken).mockResolvedValueOnce(true)

        const result = await reqAuthMiddleware({ request, env, ctx });

        expect(tokens.refreshAccessToken).toHaveBeenCalledWith('valid_refresh_token', env, ctx);
        expect(ctx.logout).toBeUndefined(); // Logout should not be flagged
        expect(result.ctx).toBe(ctx);
    });

    it('should logout if access token is expired and refresh token is present but not valid', async () => {
        const ctx: CustomExecutionContext = createExecutionContext();
        const request = createRequest('access_token=expired_token; refresh_token=invalid_refresh_token');

        // Mock implementations
        vi.mocked(jwt.verify).mockResolvedValueOnce({ isVerified: true, expired: true });
        vi.mocked(tokens.refreshAccessToken).mockResolvedValueOnce(false)

        const result = await reqAuthMiddleware({ request, env, ctx });

        expect(tokens.refreshAccessToken).toHaveBeenCalledWith('invalid_refresh_token', env, ctx);
        expect(ctx.logout).toBe(true);
    });

    it('should validate customer token and set ctx.customer appropriately', async () => {
        const ctx: CustomExecutionContext = createExecutionContext();
        const request = createRequest('access_token=valid_token; customer=valid_customer_token');

        // Mock implementations
        vi.mocked(jwt.verify).mockResolvedValueOnce({ isVerified: true, expired: false });
        vi.mocked(cookies.verifyMessage).mockResolvedValueOnce({ isValid: true, payload: { customer: 'customer_data' } });

        const result = await reqAuthMiddleware({ request, env, ctx });

        expect(ctx.customer).toEqual('customer_data');
        expect(ctx.logout).toBeUndefined(); // No need to logout
        expect(result.ctx).toBe(ctx);
    });

    it('should set ctx.customer to undefined if customer token is invalid', async () => {
        const ctx: CustomExecutionContext = createExecutionContext();
        const request = createRequest('access_token=valid_token; customer=invalid_customer_token');

        // Mock implementations
        vi.mocked(jwt.verify).mockResolvedValueOnce({ isVerified: true, expired: false });
        vi.mocked(cookies.verifyMessage).mockResolvedValueOnce({ isValid: false, payload: null });

        const result = await reqAuthMiddleware({ request, env: env, ctx });

        expect(ctx.customer).toBeUndefined();
        expect(ctx.logout).toBeUndefined(); // No need to logout
        expect(result.ctx).toBe(ctx);
    });

    it('should handle absence of cookies gracefully', async () => {
        const ctx: CustomExecutionContext = createExecutionContext();
        const request = createRequest('');

        const result = await reqAuthMiddleware({ request, env, ctx });

        expect(result.ctx).toBe(ctx); // ctx should remain unchanged
    });
});
