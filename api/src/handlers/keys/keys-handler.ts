import { RequestMuxProperties } from "../../mux/request-mux";

export const keyHandler = async ({ env }: RequestMuxProperties) => {
  const { alg, e, kty, n } = JSON.parse(env.RSA_PRIVATE_KEY)
  return Response.json({ alg, e, kty, n }, {
    headers: {
      "Cache-Control": `max-age=${1000 * 60 * 15}`
    }
  })
}
