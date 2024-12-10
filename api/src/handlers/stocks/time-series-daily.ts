import { RequestMuxProperties } from "../../mux/request-mux"
import { planGuard } from "../../utils/billing"
import { internalServerError } from "../../utils/errors"
import { CustomExecutionContext } from "../../utils/middleware"
import { buildURL, fetchWrapper } from "../../utils/stocks"

type TimeSeriesDailyProperties = {
  fn: string,
  symbol: string,
  outputsize: string,
  workerArgs: RequestMuxProperties
}

const METADATA_INFORMATION = "Daily Prices (open, high, low, close) and Volumes"

const tracker: { [key: string]: Set<string> } = {}

const guard = (request: Request, symbol: string, env: Env, ctx: CustomExecutionContext) => {
  const oid = ctx.user?.oid
  if (oid && planGuard(env.BASE_PLAN, ctx)) return false
  const trackerKey = `${oid}-${request.cf?.latitude}-${request.cf?.longitude}`
  if (trackerKey in tracker) { tracker[trackerKey].add(symbol) }
  else tracker[trackerKey] = new Set<string>().add(symbol)

  if (tracker[trackerKey].size > 3) return true
  return false
}

export const timeSeriesDaily = async ({ fn, symbol, outputsize, workerArgs }: TimeSeriesDailyProperties): Promise<Response> => {
  const { env, request, ctx } = workerArgs
  if (guard(request, symbol, env, ctx)) return new Response("Rate limited, login, or upgrade account.", {
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
      return internalServerError("Unexpected data structure returned", { data })
    }
  } catch (e) {
    return internalServerError((e as Error).message)
  }
}