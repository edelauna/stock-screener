import { RequestMuxProperties } from "../../mux/request-mux"
import { planGuard } from "../../utils/billing"
import { getCurrentDate } from "../../utils/date"
import { internalServerError } from "../../utils/errors"
import { CustomExecutionContext } from "../../utils/middleware"
import { buildURL, fetchWrapper } from "../../utils/stocks"

type TimeSeriesDailyProperties = {
  fn: string,
  symbol: string,
  outputsize: string,
  workerArgs: RequestMuxProperties
}

const METADATA_INFORMATION = "Daily Time Series with Splits and Dividend Events"

const guard = async (request: Request, symbol: string, env: Env, ctx: CustomExecutionContext) => {
  const oid = ctx.user?.oid
  if (oid && planGuard(env.BASE_PLAN, ctx)) return false

  const trackerKey = oid ? oid : `${request.cf?.latitude}:${request.cf?.longitude}`
  const trackingData = JSON.parse(await env.LOKEEL_STOCK_SCREENER_KV.get(trackerKey) ?? '{}')
  const key = getCurrentDate()
  if (key in trackingData) {
    trackingData[key] = new Set(trackingData[key]).add(symbol)
  }
  else trackingData[key] = new Set<string>().add(symbol)

  if (trackingData[key].size > 3) return true
  ctx.waitUntil(env.LOKEEL_STOCK_SCREENER_KV.put(trackerKey, JSON.stringify({ [key]: [...trackingData[key]] })))
  return false
}

export const timeSeriesDaily = async ({ fn, symbol, outputsize, workerArgs }: TimeSeriesDailyProperties): Promise<Response> => {
  const { env, request, ctx } = workerArgs
  if (await guard(request, symbol, env, ctx)) return new Response("Rate limited, login, or upgrade account.", {
    status: 429
  })

  const url = buildURL(env, `${fn}&symbol=${symbol}&outputsize=${outputsize}`)
  try {
    const responseToVerify = await fetchWrapper(url, ctx);
    const response = responseToVerify.clone()
    let check = false
    let data = ""
    const reader = responseToVerify.body?.getReader();
    if (reader) {
      const { value } = await reader.read();
      data = new TextDecoder().decode(value);
      check = data.includes(METADATA_INFORMATION)
      reader.cancel();
    }

    if (check) {
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
