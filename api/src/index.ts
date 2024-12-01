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

export default {
	async fetch(request, env, ctx): Promise<Response> {
		let response;
		try {
      response = requestMux({request, env, ctx})
		} catch(e) {
			const err = e as Error
      response = internalServerError(err.message, err);
		} finally {
			const initialResponse = await response
			const newResponse = new Response(initialResponse?.body, initialResponse)
			newResponse.headers.append("Access-Control-Allow-Origin", env.ALLOWED_ORIGIN)
			return newResponse
		}

	},
} satisfies ExportedHandler<Env>;
