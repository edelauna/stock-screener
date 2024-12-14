/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { requestMux } from "./mux/request-mux";
import { internalServerError } from "./utils/errors";
import { CustomExecutionContext, reqAuthMiddleware } from "./utils/middleware";

const postware = ({ response, ctx }: { response: Response, ctx: CustomExecutionContext }) => {
	if (ctx.logout) {
		const cookies = [
			`access_token=; Path=/; Max-Age=0; HttpOnly; Samesite=Strict`,
			`refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`,
			`customer=; Path=/; Max-Age=0; SameSite=Strict`
		];
		cookies.forEach(c => response.headers.append('Set-Cookie', c))
	}
	if (ctx.newAccessToken && ctx.newRefreshToken) {
		const cookies = [
			`access_token=${ctx.newAccessToken}; Path=/; HttpOnly; Samesite=Strict`,
			`refresh_token=${ctx.newRefreshToken}; Path=/; HttpOnly; SameSite=Strict`,
		];
		cookies.forEach(c => response.headers.append('Set-Cookie', c))
	}
	return response
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		let response;
		try {
			response = requestMux({ ...await reqAuthMiddleware({ request, env, ctx }) })
		} catch (e) {
			if (e instanceof Response) {
				response = e
			} else {
				const err = e as Error
				response = internalServerError(err.message, err);
			}
		} finally {
			const initialResponse = await response
			const newResponse = new Response(initialResponse?.body, initialResponse)
			newResponse.headers.append("Access-Control-Allow-Origin", env.ALLOWED_ORIGIN)
			newResponse.headers.append("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
			newResponse.headers.append("Access-Control-Allow-Headers", "Content-Type, Authorization");
			newResponse.headers.append('Access-Control-Allow-Credentials', 'true');

			return postware({ response: newResponse, ctx })
		}

	},
} satisfies ExportedHandler<Env>;
