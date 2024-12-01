import { RequestMuxProperties } from "../mux/request-mux"
import { internalServerError } from "../utils/errors"
import { buildURL, fetchWrapper } from "../utils/stocks"

type MarketStatusProperties = {
  fn: string,
  workerArgs: RequestMuxProperties
}

const METADATA_INFORMATION = "Global Market Open & Close Status"

export const marketStatus = async ({fn, workerArgs}: MarketStatusProperties): Promise<Response> => {
  const { env } = workerArgs
  const url = buildURL(env, `${fn}`)
  try{
    const responseToVerify = await fetchWrapper(url);
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
    
    if(check){
      return response  
    } else {
      return internalServerError("Unexpected data structure returned", {data})
    }
  } catch(e){
    return internalServerError((e as Error).message)
  }
}