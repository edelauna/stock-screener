import { getContentType } from "./headers";

export const internalServerError = async (msg: String, ctx: {} | null = null): Promise<Response> => {
  const requestId = crypto.randomUUID()
  console.log({
    error: msg,
    requestId,
    ...ctx
  })
  return new Response(JSON.stringify({
    message: "Server Error",
    requestId
  }), {
    status: 500,
    statusText: "Internal Server Error",
    headers: {
      ...getContentType("JSON")
    }
  })
}
