// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';
import { CustomExecutionContext } from '../src/utils/middleware';
// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('worker', () => {
	it('responds with 404 not found (unit style)', async () => {
		const request = new IncomingRequest('http://example.com');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(await response.text()).toMatchInlineSnapshot(`"Not found"`);
	});

	it('responds with 404 not found (integration style)', async () => {
		const response = await SELF.fetch('https://example.com');
		expect(await response.text()).toMatchInlineSnapshot(`"Not found"`);
	});
	it('sets cookies on response when ctx.logout is true', async () => {
		const request = new IncomingRequest('http://example.com');
		const ctx = createExecutionContext() as CustomExecutionContext;

		ctx.logout = true; // Simulate user logout
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.headers.get('Set-Cookie')).toContain('access_token=; Path=/; Max-Age=0; HttpOnly; Samesite=Strict');
		expect(response.headers.get('Set-Cookie')).toContain('refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict');
		expect(response.headers.get('Set-Cookie')).toContain('customer=; Path=/; Max-Age=0; SameSite=Strict');
	});

	it('sets new access and refresh tokens in cookies', async () => {

		const request = new IncomingRequest('http://example.com');
		const ctx = createExecutionContext() as CustomExecutionContext;
		ctx.newAccessToken = 'newAccessToken123'; // Simulate new access token
		ctx.newRefreshToken = 'newRefreshToken456'; // Simulate new refresh token
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.headers.get('Set-Cookie')).toContain('access_token=newAccessToken123;');

		expect(response.headers.get('Set-Cookie')).toContain('refresh_token=newRefreshToken456;');
	});

	it('correctly sets CORS headers', async () => {
		const request = new IncomingRequest('http://example.com');
		const ctx = createExecutionContext() as CustomExecutionContext;
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.headers.get('Access-Control-Allow-Origin')).toBe(env.ALLOWED_ORIGIN);

		expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
		expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
		expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
	});
});
