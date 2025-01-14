import { RequestMuxProperties } from "../../mux/request-mux";
import { internalServerError } from "../../utils/errors";
import { buildURL, fetchWrapper } from "../../utils/stocks";

type SearchSymbolHandlerProperties = {
  fn: string;
  keywords: string | null;
  workerArgs: RequestMuxProperties
}

type Data = {
  bestMatches: {}[]
}

export const searchSymbolHandler = async ({ fn, keywords, workerArgs }: SearchSymbolHandlerProperties): Promise<Response> => {
  const { env, ctx } = workerArgs
  const url = buildURL(env, `${fn}&keywords=${keywords}`);
  try {
    const responseToVerify = await fetchWrapper(url, ctx, 24 * 60 * 60 * 1000);
    const response = responseToVerify.clone()
    const data = await responseToVerify.json<Data>()
    const { bestMatches } = data
    if (bestMatches) {
      return response
    } else {
      const cache = caches.default
      ctx.waitUntil(cache.delete(url.toString()))
      return internalServerError("Unexpected data structure returned", { data })
    }
  } catch (e) {
    return internalServerError((e as Error).message)
  }
}
