import { internalServerError } from "./errors";
import { CustomExecutionContext } from "./middleware";

export const buildURL = (env: Env, body: string): URL => {
  return new URL(`${env.STOCKS_BASE_URL}${body}&apikey=${env.API_TOKEN}`);
}

export const fetchWrapper = async (url: URL, ctx: CustomExecutionContext, cacheTtl: number = 3600) => {
  const cache = caches.default
  const cacheKey = url.toString();
  console.log(cacheKey)

  const cachedResponse = await cache.match(cacheKey)
  if (cachedResponse) return cachedResponse

  let response = await fetch(url, {
    cf: {
      cacheTtlByStatus: {
        "200-299": cacheTtl,
        404: 1,
        "500-599": 0
      }
    },
  });

  if (response.status >= 200 && response.status < 300) {
    response = new Response(response.body, response)
    response.headers.set("Cache-Control", `max-age=${cacheTtl}`)
    ctx.waitUntil(cache.put(cacheKey, response.clone()))
    return response
  } else {
    return internalServerError("Stock API returned non success status", { response, body: await response.text() })
  }
}
