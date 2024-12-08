import { RequestMuxProperties } from "../../mux/request-mux";
import { internalServerError } from "../../utils/errors";
import { buildURL, fetchWrapper } from "../../utils/stocks";

type BalanceSheetHandlerProperties = {
  fn: string;
  symbol: string;
  workerArgs: RequestMuxProperties
}

const KEY = '"symbol":'

export const balanceSheetHandler = async ({ fn, symbol, workerArgs }: BalanceSheetHandlerProperties): Promise<Response> => {
  const { env, ctx } = workerArgs
  const url = buildURL(env, `${fn}&symbol=${symbol}`);
  try {
    const responseToVerify = await fetchWrapper(url, ctx);
    const response = responseToVerify.clone()
    let check = false
    let data = ""
    const reader = responseToVerify.body?.getReader();
    if (reader) {
      const { value } = await reader.read();
      data = new TextDecoder().decode(value);
      check = data.includes(KEY)
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
