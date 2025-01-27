import { getContentType } from "./headers";

type CustomerFacingMessage = {
  message: string,
  statusText?: string
}
const DEFAULT_CUSTOMER_MESSAGE: CustomerFacingMessage = {
  message: "Server Error, may be as a result of rate limits, retrying again in 1 minute could possibly have a differant result.",
  statusText: "Internal Server Error"
}
export const internalServerError = async (msg: String, ctx: {} | null = null, customerMsg: CustomerFacingMessage = DEFAULT_CUSTOMER_MESSAGE, status: number = 500, ): Promise<Response> => {
  const requestId = crypto.randomUUID()
  console.log({
    error: msg,
    requestId,
    ...ctx
  })
  return new Response(JSON.stringify({
    message: customerMsg.message,
    requestId
  }), {
    status, 
    statusText: customerMsg.statusText,
    headers: {
      ...getContentType("JSON")
    }
  })
}
